import {
    Badge,
    Button,
    Card,
    Group,
    Modal,
    NumberInput,
    Select,
    SimpleGrid,
    Stack,
    Switch,
    Table,
    Text,
    TextInput,
    Textarea,
    Title,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconAdjustments, IconPackage } from '@tabler/icons-react';
import { useEffect, useState } from 'react';
import { api } from '../api/api';

const ajusteVacio = {
    productoId: '',
    numeroLote: '',
    fechaCaducidad: '',
    cantidad: 1,
    esEntrada: true,
    motivo: '',
};

export default function InventarioPage() {
    const [data, setData] = useState<any[]>([]);
    const [productos, setProductos] = useState<any[]>([]);
    const [form, setForm] = useState<any>(ajusteVacio);
    const [opened, { open, close }] = useDisclosure();

    const load = async () => {
        const [movimientosResponse, productosResponse] = await Promise.all([
            api.get('/inventario/movimientos'),
            api.get('/productos'),
        ]);

        setData(movimientosResponse.data);
        setProductos(productosResponse.data);
    };

    useEffect(() => {
        load();
    }, []);

    function nuevoAjuste() {
        setForm(ajusteVacio);
        open();
    }

    async function guardarAjuste() {
        await api.post('/inventario/ajuste', {
            ...form,
            productoId: Number(form.productoId),
            fechaCaducidad: form.fechaCaducidad || null,
        });

        close();
        setForm(ajusteVacio);
        await load();
    }

    return (
        <>
            <div className="page-header">
                <div>
                    <Title order={2}>Inventario</Title>
                    <Text className="page-subtitle">
                        Revisa la trazabilidad del stock por producto y lote.
                    </Text>
                </div>

                <Button
                    leftSection={<IconAdjustments size={17} />}
                    onClick={nuevoAjuste}
                >
                    Ajuste de stock
                </Button>
            </div>

            <Card withBorder radius="md">
                <Group gap="xs" mb="md">
                    <IconPackage size={20} />
                    <Text fw={700}>Movimientos recientes</Text>
                    <Badge variant="light">{data.length}</Badge>
                </Group>

                <div className="table-wrapper">
                    <Table striped highlightOnHover>
                        <Table.Thead>
                            <Table.Tr>
                                <Table.Th>Fecha</Table.Th>
                                <Table.Th>Producto</Table.Th>
                                <Table.Th>Lote</Table.Th>
                                <Table.Th>Tipo</Table.Th>
                                <Table.Th>Cantidad</Table.Th>
                                <Table.Th>Stock anterior</Table.Th>
                                <Table.Th>Stock posterior</Table.Th>
                            </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>
                            {data.map((item) => (
                                <Table.Tr key={item.id}>
                                    <Table.Td>
                                        {new Date(item.fechaMovimiento).toLocaleString()}
                                    </Table.Td>
                                    <Table.Td><Text fw={600}>{item.producto}</Text></Table.Td>
                                    <Table.Td>{item.lote || '-'}</Table.Td>
                                    <Table.Td>
                                        <Badge variant="light">{item.tipo}</Badge>
                                    </Table.Td>
                                    <Table.Td>{item.cantidad}</Table.Td>
                                    <Table.Td>{item.stockAnterior}</Table.Td>
                                    <Table.Td>{item.stockPosterior}</Table.Td>
                                </Table.Tr>
                            ))}
                        </Table.Tbody>
                    </Table>
                </div>
            </Card>

            <Modal opened={opened} onClose={close} title="Ajustar inventario" size="lg">
                <Stack>
                    <Select
                        searchable
                        required
                        label="Producto"
                        placeholder="Seleccionar producto"
                        data={productos.map((producto) => ({
                            value: String(producto.id),
                            label: `${producto.codigo} - ${producto.nombre} · Stock ${producto.stock}`,
                        }))}
                        value={form.productoId}
                        onChange={(value) => setForm({ ...form, productoId: value ?? '' })}
                    />

                    <Switch
                        label={form.esEntrada ? 'Entrada de inventario' : 'Salida de inventario'}
                        description="Cambia el tipo según si deseas aumentar o disminuir el stock."
                        checked={form.esEntrada}
                        onChange={(event) => setForm({
                            ...form,
                            esEntrada: event.currentTarget.checked,
                        })}
                    />

                    <SimpleGrid cols={{ base: 1, sm: 2 }}>
                        <TextInput
                            label="Lote"
                            value={form.numeroLote}
                            onChange={(event) => setForm({
                                ...form,
                                numeroLote: event.currentTarget.value,
                            })}
                        />
                        <TextInput
                            type="date"
                            label="Caducidad"
                            value={form.fechaCaducidad}
                            onChange={(event) => setForm({
                                ...form,
                                fechaCaducidad: event.currentTarget.value,
                            })}
                        />
                        <NumberInput
                            label="Cantidad"
                            min={0.01}
                            decimalScale={2}
                            value={form.cantidad}
                            onChange={(value) => setForm({ ...form, cantidad: value })}
                        />
                    </SimpleGrid>

                    <Textarea
                        label="Motivo del ajuste"
                        required
                        autosize
                        minRows={2}
                        placeholder="Explique brevemente por qué se realiza el ajuste."
                        value={form.motivo}
                        onChange={(event) => setForm({
                            ...form,
                            motivo: event.currentTarget.value,
                        })}
                    />

                    <Group justify="flex-end">
                        <Button variant="default" onClick={close}>Cancelar</Button>
                        <Button
                            onClick={guardarAjuste}
                            disabled={!form.productoId || !form.motivo || Number(form.cantidad) <= 0}
                        >
                            Guardar ajuste
                        </Button>
                    </Group>
                </Stack>
            </Modal>
        </>
    );
}
