import {
    ActionIcon,
    Alert,
    Badge,
    Button,
    FileButton,
    Group,
    Modal,
    NumberInput,
    SimpleGrid,
    Table,
    Text,
    TextInput,
    Title,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconDownload, IconEdit, IconTrash, IconUpload } from '@tabler/icons-react';
import { useEffect, useRef, useState } from 'react';
import { api } from '../api/api';
import type { Producto } from '../models';

const productoVacio = {
    codigo: '',
    nombre: '',
    principioActivo: '',
    laboratorio: '',
    presentacion: '',
    concentracion: '',
    unidadMedida: 'UNIDAD',
    unidadesPorCaja: 0,
    precioCaja: 0,
    precioCajaDescuento: 0,
    precioCompra: 0,
    precioVenta: 0,
    stockMinimo: 5,
};

export default function ProductosPage() {
    const [data, setData] = useState<Producto[]>([]);
    const [form, setForm] = useState<any>(productoVacio);
    const [editId, setEditId] = useState<number | null>(null);
    const [opened, { open, close }] = useDisclosure();
    const resetRef = useRef<() => void>(null);
    const [resultadoImportacion, setResultadoImportacion] = useState<any>(null);
    const [errorImportacion, setErrorImportacion] = useState<string | null>(null);

    const load = async () => {
        const response = await api.get('/productos');
        setData(response.data);
    };

    useEffect(() => {
        load();
    }, []);

    function nuevo() {
        setEditId(null);
        setForm(productoVacio);
        open();
    }

    function editar(producto: any) {
        setEditId(producto.id);
        setForm({ ...productoVacio, ...producto });
        open();
    }

    async function save() {
        if (editId) {
            await api.put(`/productos/${editId}`, form);
        } else {
            await api.post('/productos', form);
        }

        close();
        await load();
    }

    async function baja(id: number) {
        if (!confirm('¿Dar de baja este producto?')) {
            return;
        }

        await api.patch(`/productos/${id}/baja`);
        await load();
    }

    async function importar(file: File | null) {
        if (!file) {
            return;
        }

        setResultadoImportacion(null);
        setErrorImportacion(null);

        try {
            const formData = new FormData();
            formData.append('archivo', file);

            const response = await api.post('/productos/importar-excel', formData);

            setResultadoImportacion(response.data);
            await load();
        } catch (error: any) {
            const responseData = error.response?.data;

            setErrorImportacion(
                typeof responseData === 'string'
                    ? responseData
                    : responseData?.message
                      ?? responseData?.title
                      ?? 'No se pudo importar el archivo. Revise la plantilla e inténtelo nuevamente.',
            );
        } finally {
            resetRef.current?.();
        }
    }

    function descargarPlantilla() {
        const link = document.createElement('a');
        link.href = '/plantilla_productos_consultorio_amelita.xlsx';
        link.download = 'plantilla_productos_consultorio_amelita.xlsx';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    return (
        <>
            <div className="page-header">
                <div>
                    <Title order={2}>Productos de farmacia</Title>
                    <Text c="dimmed" mt={3}>
                        Administra el catálogo, stock mínimo e importación masiva desde Excel.
                    </Text>
                </div>

                <Group>
                    <Button
                        variant="default"
                        leftSection={<IconDownload size={17} />}
                        onClick={descargarPlantilla}
                    >
                        Descargar plantilla
                    </Button>

                    <FileButton
                        resetRef={resetRef}
                        onChange={importar}
                        accept=".xlsx"
                    >
                        {(props) => (
                            <Button
                                {...props}
                                variant="light"
                                leftSection={<IconUpload size={17} />}
                            >
                                Importar Excel
                            </Button>
                        )}
                    </FileButton>

                    <Button onClick={nuevo}>Nuevo producto</Button>
                </Group>
            </div>

            {errorImportacion && (
                <Alert color="red" title="No se pudo importar el Excel" mb="md">
                    {errorImportacion}
                </Alert>
            )}

            {resultadoImportacion && (
                <Alert
                    color={resultadoImportacion.errores > 0 ? 'yellow' : 'green'}
                    title="Importación finalizada"
                    mb="md"
                >
                    <Text size="sm">
                        Creados: {resultadoImportacion.creados} · Actualizados:{' '}
                        {resultadoImportacion.actualizados} · Errores: {resultadoImportacion.errores}
                    </Text>

                    {resultadoImportacion.filasConError?.length > 0 && (
                        <div style={{ marginTop: 8 }}>
                            {resultadoImportacion.filasConError.slice(0, 8).map((item: any) => (
                                <Text key={item.fila} size="xs">
                                    Fila {item.fila}: {item.error}
                                </Text>
                            ))}
                        </div>
                    )}
                </Alert>
            )}

            <div className="table-wrapper">
                <Table striped withTableBorder>
                <Table.Thead>
                    <Table.Tr>
                        <Table.Th>Código</Table.Th>
                        <Table.Th>Producto</Table.Th>
                        <Table.Th>Laboratorio</Table.Th>
                        <Table.Th>Stock</Table.Th>
                        <Table.Th>Precio</Table.Th>
                        <Table.Th>Estado</Table.Th>
                        <Table.Th>Caducidad</Table.Th>
                        <Table.Th />
                    </Table.Tr>
                </Table.Thead>

                <Table.Tbody>
                    {data.map((producto) => (
                        <Table.Tr key={producto.id}>
                            <Table.Td>{producto.codigo}</Table.Td>
                            <Table.Td>{producto.nombre}</Table.Td>
                            <Table.Td>{producto.laboratorio}</Table.Td>
                            <Table.Td>{producto.stock}</Table.Td>
                            <Table.Td>${producto.precioVenta}</Table.Td>
                            <Table.Td>
                                <Badge
                                    color={
                                        producto.estado === 'OK'
                                            ? 'green'
                                            : producto.estado === 'AGOTADO'
                                              ? 'red'
                                              : 'yellow'
                                    }
                                >
                                    {producto.estado}
                                </Badge>
                            </Table.Td>
                            <Table.Td>{producto.proximaCaducidad ?? '-'}</Table.Td>
                            <Table.Td>
                                <Group gap="xs">
                                    <ActionIcon
                                        variant="light"
                                        onClick={() => editar(producto)}
                                    >
                                        <IconEdit size={16} />
                                    </ActionIcon>

                                    <ActionIcon
                                        color="red"
                                        variant="light"
                                        onClick={() => baja(producto.id)}
                                    >
                                        <IconTrash size={16} />
                                    </ActionIcon>
                                </Group>
                            </Table.Td>
                        </Table.Tr>
                    ))}
                </Table.Tbody>
            </Table>
            </div>

            <Modal
                opened={opened}
                onClose={close}
                title={editId ? 'Editar producto' : 'Nuevo producto'}
                size="lg"
            >
                <SimpleGrid cols={{ base: 1, sm: 2 }}>
                    <TextInput
                        label="Código"
                        value={form.codigo}
                        onChange={(event) =>
                            setForm({ ...form, codigo: event.currentTarget.value })
                        }
                    />

                    <TextInput
                        label="Nombre"
                        value={form.nombre}
                        onChange={(event) =>
                            setForm({ ...form, nombre: event.currentTarget.value })
                        }
                    />

                    <TextInput
                        label="Principio activo"
                        value={form.principioActivo}
                        onChange={(event) =>
                            setForm({ ...form, principioActivo: event.currentTarget.value })
                        }
                    />

                    <TextInput
                        label="Laboratorio"
                        value={form.laboratorio}
                        onChange={(event) =>
                            setForm({ ...form, laboratorio: event.currentTarget.value })
                        }
                    />

                    <TextInput
                        label="Presentación"
                        value={form.presentacion}
                        onChange={(event) =>
                            setForm({ ...form, presentacion: event.currentTarget.value })
                        }
                    />

                    <TextInput
                        label="Concentración"
                        value={form.concentracion}
                        onChange={(event) =>
                            setForm({ ...form, concentracion: event.currentTarget.value })
                        }
                    />

                    <TextInput
                        label="Unidad de medida"
                        value={form.unidadMedida}
                        onChange={(event) =>
                            setForm({ ...form, unidadMedida: event.currentTarget.value })
                        }
                    />

                    <NumberInput
                        label="Unidades por caja"
                        value={form.unidadesPorCaja}
                        onChange={(value) => setForm({ ...form, unidadesPorCaja: value })}
                    />

                    <NumberInput
                        label="Precio caja"
                        decimalScale={2}
                        value={form.precioCaja}
                        onChange={(value) => setForm({ ...form, precioCaja: value })}
                    />

                    <NumberInput
                        label="Precio caja con descuento"
                        decimalScale={2}
                        value={form.precioCajaDescuento}
                        onChange={(value) =>
                            setForm({ ...form, precioCajaDescuento: value })
                        }
                    />

                    <NumberInput
                        label="Precio compra por unidad"
                        decimalScale={2}
                        value={form.precioCompra}
                        onChange={(value) => setForm({ ...form, precioCompra: value })}
                    />

                    <NumberInput
                        label="Precio venta"
                        decimalScale={2}
                        value={form.precioVenta}
                        onChange={(value) => setForm({ ...form, precioVenta: value })}
                    />

                    <NumberInput
                        label="Stock mínimo"
                        value={form.stockMinimo}
                        onChange={(value) => setForm({ ...form, stockMinimo: value })}
                    />
                </SimpleGrid>

                <Group justify="flex-end" mt="md">
                    <Button variant="default" onClick={close}>
                        Cancelar
                    </Button>
                    <Button onClick={save}>Guardar</Button>
                </Group>
            </Modal>
        </>
    );
}
