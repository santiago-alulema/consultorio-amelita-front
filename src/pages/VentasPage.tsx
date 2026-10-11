import {
    ActionIcon,
    Badge,
    Button,
    Card,
    Group,
    Modal,
    NumberInput,
    Select,
    SimpleGrid,
    Stack,
    Table,
    Text,
    TextInput,
    Title,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconPlus, IconShoppingCart, IconTrash } from '@tabler/icons-react';
import { useEffect, useMemo, useState } from 'react';
import { api } from '../api/api';

const itemVacio = () => ({
    productoId: '',
    cantidad: 1,
    precioUnitario: 0,
});

const ventaVacia = () => ({
    identificacionCliente: '',
    nombreCliente: '',
    formaPago: 'Efectivo',
    detalles: [itemVacio()],
});

export default function VentasPage() {
    const [data, setData] = useState<any[]>([]);
    const [productos, setProductos] = useState<any[]>([]);
    const [form, setForm] = useState<any>(ventaVacia());
    const [opened, { open, close }] = useDisclosure();

    const total = useMemo(
        () => form.detalles.reduce(
            (suma: number, item: any) =>
                suma + Number(item.cantidad || 0) * Number(item.precioUnitario || 0),
            0,
        ),
        [form],
    );

    const load = async () => {
        const [ventasResponse, productosResponse] = await Promise.all([
            api.get('/ventas'),
            api.get('/productos'),
        ]);

        setData(ventasResponse.data);
        setProductos(productosResponse.data);
    };

    useEffect(() => {
        load();
    }, []);

    function nuevaVenta() {
        setForm(ventaVacia());
        open();
    }

    function actualizarDetalle(index: number, campo: string, value: any) {
        const detalles = [...form.detalles];
        detalles[index] = { ...detalles[index], [campo]: value };

        if (campo === 'productoId') {
            const producto = productos.find((item) => item.id === Number(value));

            if (producto) {
                detalles[index].precioUnitario = producto.precioVenta;
            }
        }

        setForm({ ...form, detalles });
    }

    function eliminarDetalle(index: number) {
        if (form.detalles.length === 1) {
            return;
        }

        setForm({
            ...form,
            detalles: form.detalles.filter(
                (_: any, itemIndex: number) => itemIndex !== index,
            ),
        });
    }

    async function guardarVenta() {
        await api.post('/ventas', {
            ...form,
            detalles: form.detalles.map((item: any) => ({
                ...item,
                productoId: Number(item.productoId),
            })),
        });

        close();
        setForm(ventaVacia());
        await load();
    }

    return (
        <>
            <div className="page-header">
                <div>
                    <Title order={2}>Ventas de farmacia</Title>
                    <Text className="page-subtitle">
                        Registra ventas y descuenta automáticamente las unidades del inventario.
                    </Text>
                </div>

                <Button leftSection={<IconShoppingCart size={17} />} onClick={nuevaVenta}>
                    Nueva venta
                </Button>
            </div>

            <Card withBorder radius="md">
                <div className="table-wrapper">
                    <Table striped highlightOnHover>
                        <Table.Thead>
                            <Table.Tr>
                                <Table.Th>Fecha</Table.Th>
                                <Table.Th>Cliente</Table.Th>
                                <Table.Th>Forma de pago</Table.Th>
                                <Table.Th>Total</Table.Th>
                            </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>
                            {data.map((venta) => (
                                <Table.Tr key={venta.id}>
                                    <Table.Td>{new Date(venta.fechaVenta).toLocaleString()}</Table.Td>
                                    <Table.Td>{venta.nombreCliente || 'Consumidor final'}</Table.Td>
                                    <Table.Td>
                                        <Badge variant="light">{venta.formaPago || 'No definido'}</Badge>
                                    </Table.Td>
                                    <Table.Td>
                                        <Text fw={700}>${Number(venta.total).toFixed(2)}</Text>
                                    </Table.Td>
                                </Table.Tr>
                            ))}
                        </Table.Tbody>
                    </Table>
                </div>
            </Card>

            <Modal opened={opened} onClose={close} title="Registrar venta" size="xl">
                <Stack>
                    <SimpleGrid cols={{ base: 1, sm: 3 }}>
                        <TextInput
                            label="Identificación"
                            value={form.identificacionCliente}
                            onChange={(event) => setForm({
                                ...form,
                                identificacionCliente: event.currentTarget.value,
                            })}
                        />
                        <TextInput
                            label="Cliente"
                            value={form.nombreCliente}
                            onChange={(event) => setForm({
                                ...form,
                                nombreCliente: event.currentTarget.value,
                            })}
                        />
                        <Select
                            label="Forma de pago"
                            data={['Efectivo', 'Transferencia', 'Tarjeta', 'Otro']}
                            value={form.formaPago}
                            onChange={(value) => setForm({
                                ...form,
                                formaPago: value ?? 'Efectivo',
                            })}
                        />
                    </SimpleGrid>

                    {form.detalles.map((detalle: any, index: number) => (
                        <Card key={index} withBorder radius="md">
                            <SimpleGrid cols={{ base: 1, sm: 4 }}>
                                <Select
                                    searchable
                                    label="Producto"
                                    data={productos.map((producto) => ({
                                        value: String(producto.id),
                                        label: `${producto.nombre} · Stock ${producto.stock}`,
                                    }))}
                                    value={detalle.productoId}
                                    onChange={(value) =>
                                        actualizarDetalle(index, 'productoId', value)
                                    }
                                />
                                <NumberInput
                                    label="Cantidad"
                                    min={0.01}
                                    value={detalle.cantidad}
                                    onChange={(value) =>
                                        actualizarDetalle(index, 'cantidad', value)
                                    }
                                />
                                <NumberInput
                                    label="Precio"
                                    prefix="$"
                                    decimalScale={2}
                                    value={detalle.precioUnitario}
                                    onChange={(value) =>
                                        actualizarDetalle(index, 'precioUnitario', value)
                                    }
                                />
                                <Group align="flex-end">
                                    <ActionIcon
                                        color="red"
                                        variant="light"
                                        size="lg"
                                        onClick={() => eliminarDetalle(index)}
                                        disabled={form.detalles.length === 1}
                                    >
                                        <IconTrash size={17} />
                                    </ActionIcon>
                                </Group>
                            </SimpleGrid>
                        </Card>
                    ))}

                    <Button
                        variant="light"
                        leftSection={<IconPlus size={16} />}
                        onClick={() => setForm({
                            ...form,
                            detalles: [...form.detalles, itemVacio()],
                        })}
                    >
                        Agregar producto
                    </Button>

                    <Group justify="space-between" align="center">
                        <div>
                            <Text size="sm" c="dimmed">Total de la venta</Text>
                            <Text fw={800} size="xl">${total.toFixed(2)}</Text>
                        </div>

                        <Group>
                            <Button variant="default" onClick={close}>Cancelar</Button>
                            <Button
                                onClick={guardarVenta}
                                disabled={form.detalles.some((item: any) => !item.productoId)}
                            >
                                Guardar venta
                            </Button>
                        </Group>
                    </Group>
                </Stack>
            </Modal>
        </>
    );
}
