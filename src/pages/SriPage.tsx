import {
    Alert,
    Badge,
    Button,
    Card,
    FileInput,
    Group,
    Modal,
    Select,
    Stack,
    Table,
    Text,
    Title,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconFileInvoice, IconUpload } from '@tabler/icons-react';
import { useEffect, useState } from 'react';
import { api } from '../api/api';

export default function SriPage() {
    const [data, setData] = useState<any[]>([]);
    const [factura, setFactura] = useState<any>(null);
    const [cargandoRide, setCargandoRide] = useState(false);
    const [errorRide, setErrorRide] = useState('');
    const [productos, setProductos] = useState<any[]>([]);
    const [xml, setXml] = useState<File | null>(null);
    const [pdf, setPdf] = useState<File | null>(null);
    const [opened, { open, close }] = useDisclosure();

    const load = async () => {
        const [documentosResponse, productosResponse] = await Promise.all([
            api.get('/documentos-sri'),
            api.get('/productos'),
        ]);

        setData(documentosResponse.data);
        setProductos(productosResponse.data);
    };

    useEffect(() => {
        load();
    }, []);

    async function subirFactura() {
        if (!xml) {
            return;
        }

        const formData = new FormData();
        formData.append('xml', xml);

        if (pdf) {
            formData.append('ridePdf', pdf);
        }

        await api.post('/documentos-sri/subir', formData);
        close();
        setXml(null);
        setPdf(null);
        await load();
    }

    async function relacionar(detalleId: number, productoId: string | null) {
        if (!productoId) {
            return;
        }

        await api.patch(`/documentos-sri/detalle/${detalleId}/producto/${productoId}`);
        await load();
    }

    async function procesarStock(id: number) {
        await api.post(`/documentos-sri/${id}/procesar-stock`);
        await load();
    }

    async function abrirRide(id: number) {
        setErrorRide('');
        setCargandoRide(true);
        try {
            const respuesta = await api.get('/documentos-sri/' + id + '/ride', { responseType: 'blob' });
            const url = URL.createObjectURL(respuesta.data);
            const enlace = document.createElement('a');
            enlace.href = url;
            enlace.target = '_blank';
            enlace.rel = 'noopener noreferrer';
            enlace.click();
            window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
        } catch {
            setErrorRide('El archivo RIDE no está disponible.');
        } finally {
            setCargandoRide(false);
        }
    }

    return (
        <>
            <div className="page-header">
                <div>
                    <Title order={2}>Facturas SRI · XML / RIDE</Title>
                    <Text className="page-subtitle">
                        Carga la factura emitida en SRI, relaciona sus ítems y descuenta el stock una sola vez.
                    </Text>
                </div>

                <Button leftSection={<IconUpload size={17} />} onClick={open}>
                    Subir factura
                </Button>
            </div>

            <Stack gap="md">
                {data.map((documento) => (
                    <Card key={documento.id} withBorder radius="md">
                        <Group justify="space-between" align="flex-start" mb="md">
                            <div>
                                <Group gap="xs">
                                    <IconFileInvoice size={20} />
                                    <Text fw={700}>{documento.numeroFactura}</Text>
                                    <Badge color={documento.inventarioProcesado ? 'green' : 'yellow'}>
                                        {documento.inventarioProcesado
                                            ? 'Stock procesado'
                                            : 'Pendiente de stock'}
                                    </Badge>
                                </Group>
                                <Text size="sm" c="dimmed" mt={4}>
                                    {documento.razonSocialEmisor} · {new Date(documento.fechaEmision).toLocaleDateString()} · Total ${Number(documento.total).toFixed(2)}
                                </Text>
                            </div>

                            <Group gap="xs">
                                <Button size="sm" variant="default" onClick={() => {
                                    setErrorRide('');
                                    setFactura(documento);
                                }}>
                                    Ver factura
                                </Button>
                                <Button
                                    size="sm"
                                    variant={documento.inventarioProcesado ? 'default' : 'light'}
                                    disabled={documento.inventarioProcesado}
                                    onClick={() => procesarStock(documento.id)}
                                >
                                    {documento.inventarioProcesado
                                        ? 'Inventario actualizado'
                                        : 'Descontar stock'}
                                </Button>
                            </Group>
                        </Group>

                        <div className="table-wrapper">
                            <Table striped highlightOnHover>
                                <Table.Thead>
                                    <Table.Tr>
                                        <Table.Th>Código XML</Table.Th>
                                        <Table.Th>Descripción</Table.Th>
                                        <Table.Th>Cantidad</Table.Th>
                                        <Table.Th>Producto relacionado</Table.Th>
                                    </Table.Tr>
                                </Table.Thead>
                                <Table.Tbody>
                                    {documento.detalles.map((detalle: any) => (
                                        <Table.Tr key={detalle.id}>
                                            <Table.Td>{detalle.codigoPrincipal}</Table.Td>
                                            <Table.Td>{detalle.descripcion}</Table.Td>
                                            <Table.Td>{detalle.cantidad}</Table.Td>
                                            <Table.Td>
                                                <Select
                                                    searchable
                                                    clearable
                                                    placeholder="Relacionar producto"
                                                    data={productos.map((producto) => ({
                                                        value: String(producto.id),
                                                        label: `${producto.codigo} - ${producto.nombre}`,
                                                    }))}
                                                    value={detalle.productoId
                                                        ? String(detalle.productoId)
                                                        : null}
                                                    onChange={(value) => relacionar(detalle.id, value)}
                                                    disabled={documento.inventarioProcesado}
                                                />
                                            </Table.Td>
                                        </Table.Tr>
                                    ))}
                                </Table.Tbody>
                            </Table>
                        </div>
                    </Card>
                ))}

                {data.length === 0 && (
                    <Card withBorder radius="md" py="xl">
                        <Text ta="center" c="dimmed">
                            Todavía no se han cargado facturas SRI.
                        </Text>
                    </Card>
                )}
            </Stack>

            <Modal
                opened={!!factura}
                onClose={() => { if (!cargandoRide) setFactura(null); }}
                title={factura ? 'Factura ' + factura.numeroFactura : 'Factura'}
                size="xl"
            >
                {factura && (
                    <Stack>
                        <Text><b>Emisor</b> {factura.razonSocialEmisor} · {factura.rucEmisor}</Text>
                        <Text><b>Fecha</b> {new Date(factura.fechaEmision).toLocaleDateString()}</Text>
                        <Text><b>Comprador</b> {factura.identificacionComprador || '—'}</Text>
                        <Text style={{ overflowWrap: 'anywhere' }}><b>Clave de acceso</b> {factura.claveAcceso}</Text>
                        <Table.ScrollContainer minWidth={480}>
                            <Table striped>
                                <Table.Thead>
                                    <Table.Tr>
                                        <Table.Th>Descripción</Table.Th>
                                        <Table.Th>Cantidad</Table.Th>
                                        <Table.Th>Precio unitario</Table.Th>
                                        <Table.Th>Subtotal</Table.Th>
                                    </Table.Tr>
                                </Table.Thead>
                                <Table.Tbody>
                                    {factura.detalles.map((detalle: any) => (
                                        <Table.Tr key={detalle.id}>
                                            <Table.Td>{detalle.descripcion}</Table.Td>
                                            <Table.Td>{detalle.cantidad}</Table.Td>
                                            <Table.Td>&#36;{detalle.precioUnitario}</Table.Td>
                                            <Table.Td>&#36;{Number(detalle.precioTotalSinImpuesto).toFixed(2)}</Table.Td>
                                        </Table.Tr>
                                    ))}
                                </Table.Tbody>
                            </Table>
                        </Table.ScrollContainer>
                        <Group justify="space-between">
                            <Text fw={700}>Total &#36;{Number(factura.total).toFixed(2)}</Text>
                            {factura.ridePdfPath && (
                                <Button loading={cargandoRide} onClick={() => abrirRide(factura.id)}>
                                    Abrir RIDE
                                </Button>
                            )}
                        </Group>
                        {errorRide && <Alert color="red">{errorRide}</Alert>}
                    </Stack>
                )}
            </Modal>

            <Modal opened={opened} onClose={close} title="Subir XML y RIDE" centered>
                <Stack>
                    <FileInput
                        label="XML de la factura"
                        description="Archivo XML autorizado por el SRI."
                        accept=".xml,text/xml"
                        value={xml}
                        onChange={setXml}
                        required
                    />
                    <FileInput
                        label="RIDE PDF"
                        description="Opcional. Se conservará junto con el XML."
                        accept=".pdf,application/pdf"
                        value={pdf}
                        onChange={setPdf}
                    />
                    <Group justify="flex-end">
                        <Button variant="default" onClick={close}>Cancelar</Button>
                        <Button onClick={subirFactura} disabled={!xml}>Guardar factura</Button>
                    </Group>
                </Stack>
            </Modal>
        </>
    );
}
