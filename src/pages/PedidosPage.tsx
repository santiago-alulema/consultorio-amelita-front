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
    Table,
    Text,
    Textarea,
    TextInput,
    Title,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconPackageImport, IconPlus, IconTruckDelivery } from '@tabler/icons-react';
import { useEffect, useState } from 'react';
import { api } from '../api/api';

const detalleVacio = () => ({
    productoId: '',
    cantidadSolicitada: 1,
    precioUnitario: 0,
});

export default function PedidosPage() {
    const [data, setData] = useState<any[]>([]);
    const [productos, setProductos] = useState<any[]>([]);
    const [proveedores, setProveedores] = useState<any[]>([]);
    const [form, setForm] = useState<any>({
        proveedorId: '',
        observaciones: '',
        detalles: [detalleVacio()],
    });
    const [recepcion, setRecepcion] = useState<any>(null);

    const [opened, { open, close }] = useDisclosure();
    const [recOpened, { open: openRecepcion, close: closeRecepcion }] = useDisclosure();

    const load = async () => {
        const [pedidosResponse, productosResponse, proveedoresResponse] = await Promise.all([
            api.get('/pedidos'),
            api.get('/productos'),
            api.get('/proveedores'),
        ]);

        setData(pedidosResponse.data);
        setProductos(productosResponse.data);
        setProveedores(proveedoresResponse.data);
    };

    useEffect(() => {
        load();
    }, []);

    function nuevoPedido() {
        setForm({
            proveedorId: '',
            observaciones: '',
            detalles: [detalleVacio()],
        });
        open();
    }

    function actualizarDetalle(index: number, campo: string, value: any) {
        const detalles = [...form.detalles];
        detalles[index] = { ...detalles[index], [campo]: value };
        setForm({ ...form, detalles });
    }

    async function guardarPedido() {
        await api.post('/pedidos', {
            proveedorId: form.proveedorId ? Number(form.proveedorId) : null,
            observaciones: form.observaciones || null,
            detalles: form.detalles.map((item: any) => ({
                productoId: Number(item.productoId),
                cantidadSolicitada: item.cantidadSolicitada,
                precioUnitario: item.precioUnitario || null,
            })),
        });

        close();
        await load();
    }

    function abrirRecepcion(pedido: any) {
        setRecepcion({
            id: pedido.id,
            observaciones: '',
            detalles: pedido.detalles
                .filter((detalle: any) => detalle.cantidadRecibida < detalle.cantidadSolicitada)
                .map((detalle: any) => ({
                    pedidoDetalleId: detalle.id,
                    productoId: detalle.productoId,
                    nombre: detalle.nombre,
                    cantidad: Math.max(0, detalle.cantidadSolicitada - detalle.cantidadRecibida),
                    numeroLote: '',
                    fechaCaducidad: '',
                    precioCompra: detalle.precioUnitario ?? 0,
                })),
        });
        openRecepcion();
    }

    function actualizarRecepcion(index: number, campo: string, value: any) {
        const detalles = [...recepcion.detalles];
        detalles[index] = { ...detalles[index], [campo]: value };
        setRecepcion({ ...recepcion, detalles });
    }

    async function recibirPedido() {
        await api.post(`/pedidos/${recepcion.id}/recibir`, {
            observaciones: recepcion.observaciones || null,
            detalles: recepcion.detalles.map((detalle: any) => ({
                ...detalle,
                fechaCaducidad: detalle.fechaCaducidad || null,
            })),
        });

        closeRecepcion();
        setRecepcion(null);
        await load();
    }

    function estadoPedido(estado: number) {
        const estados: Record<number, { label: string; color: string }> = {
            1: { label: 'Borrador', color: 'gray' },
            2: { label: 'Solicitado', color: 'blue' },
            3: { label: 'Parcial', color: 'yellow' },
            4: { label: 'Recibido', color: 'green' },
            5: { label: 'Cancelado', color: 'red' },
        };

        return estados[estado] ?? { label: String(estado), color: 'gray' };
    }

    return (
        <>
            <div className="page-header">
                <div>
                    <Title order={2}>Pedidos y recepciones</Title>
                    <Text className="page-subtitle">
                        Controla lo solicitado a proveedores y alimenta el stock únicamente al recibirlo.
                    </Text>
                </div>

                <Button leftSection={<IconPlus size={17} />} onClick={nuevoPedido}>
                    Nuevo pedido
                </Button>
            </div>

            <Card withBorder radius="md">
                <div className="table-wrapper">
                    <Table striped highlightOnHover>
                        <Table.Thead>
                            <Table.Tr>
                                <Table.Th>Fecha</Table.Th>
                                <Table.Th>Estado</Table.Th>
                                <Table.Th>Proveedor</Table.Th>
                                <Table.Th>Productos</Table.Th>
                                <Table.Th>Acciones</Table.Th>
                            </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>
                            {data.map((pedido) => {
                                const estado = estadoPedido(Number(pedido.estado));

                                return (
                                    <Table.Tr key={pedido.id}>
                                        <Table.Td>{new Date(pedido.fechaPedido).toLocaleDateString()}</Table.Td>
                                        <Table.Td>
                                            <Badge color={estado.color}>{estado.label}</Badge>
                                        </Table.Td>
                                        <Table.Td>{pedido.proveedor ?? '-'}</Table.Td>
                                        <Table.Td>
                                            <Stack gap={2}>
                                                {pedido.detalles.map((detalle: any) => (
                                                    <Text key={detalle.id} size="sm">
                                                        {detalle.nombre}: {detalle.cantidadRecibida}/{detalle.cantidadSolicitada}
                                                    </Text>
                                                ))}
                                            </Stack>
                                        </Table.Td>
                                        <Table.Td>
                                            {Number(pedido.estado) !== 4 && Number(pedido.estado) !== 5 && (
                                                <Button
                                                    size="xs"
                                                    variant="light"
                                                    leftSection={<IconPackageImport size={15} />}
                                                    onClick={() => abrirRecepcion(pedido)}
                                                >
                                                    Recibir
                                                </Button>
                                            )}
                                        </Table.Td>
                                    </Table.Tr>
                                );
                            })}
                        </Table.Tbody>
                    </Table>
                </div>
            </Card>

            <Modal opened={opened} onClose={close} title="Nuevo pedido" size="xl">
                <Stack>
                    <Select
                        searchable
                        clearable
                        label="Proveedor"
                        placeholder="Seleccionar proveedor"
                        data={proveedores.map((proveedor) => ({
                            value: String(proveedor.id),
                            label: proveedor.razonSocial,
                        }))}
                        value={form.proveedorId || null}
                        onChange={(value) => setForm({ ...form, proveedorId: value ?? '' })}
                    />

                    {form.detalles.map((detalle: any, index: number) => (
                        <Card key={index} withBorder radius="md">
                            <SimpleGrid cols={{ base: 1, sm: 3 }}>
                                <Select
                                    searchable
                                    label="Producto"
                                    data={productos.map((producto) => ({
                                        value: String(producto.id),
                                        label: `${producto.codigo} - ${producto.nombre}`,
                                    }))}
                                    value={detalle.productoId}
                                    onChange={(value) => actualizarDetalle(index, 'productoId', value)}
                                />
                                <NumberInput
                                    label="Cantidad solicitada"
                                    min={0.01}
                                    value={detalle.cantidadSolicitada}
                                    onChange={(value) => actualizarDetalle(index, 'cantidadSolicitada', value)}
                                />
                                <NumberInput
                                    label="Precio estimado"
                                    prefix="$"
                                    decimalScale={2}
                                    min={0}
                                    value={detalle.precioUnitario}
                                    onChange={(value) => actualizarDetalle(index, 'precioUnitario', value)}
                                />
                            </SimpleGrid>
                        </Card>
                    ))}

                    <Button
                        variant="light"
                        leftSection={<IconPlus size={16} />}
                        onClick={() => setForm({
                            ...form,
                            detalles: [...form.detalles, detalleVacio()],
                        })}
                    >
                        Agregar producto
                    </Button>

                    <Textarea
                        label="Observaciones"
                        autosize
                        minRows={2}
                        value={form.observaciones}
                        onChange={(event) => setForm({
                            ...form,
                            observaciones: event.currentTarget.value,
                        })}
                    />

                    <Group justify="flex-end">
                        <Button variant="default" onClick={close}>Cancelar</Button>
                        <Button
                            leftSection={<IconTruckDelivery size={17} />}
                            onClick={guardarPedido}
                            disabled={form.detalles.some((item: any) => !item.productoId)}
                        >
                            Guardar pedido
                        </Button>
                    </Group>
                </Stack>
            </Modal>

            <Modal
                opened={recOpened}
                onClose={closeRecepcion}
                title="Recibir pedido"
                size="xl"
            >
                <Stack>
                    {recepcion?.detalles.map((detalle: any, index: number) => (
                        <Card key={detalle.pedidoDetalleId} withBorder radius="md">
                            <Text fw={700} mb="sm">{detalle.nombre}</Text>
                            <SimpleGrid cols={{ base: 1, sm: 4 }}>
                                <NumberInput
                                    label="Cantidad recibida"
                                    min={0}
                                    value={detalle.cantidad}
                                    onChange={(value) => actualizarRecepcion(index, 'cantidad', value)}
                                />
                                <TextInput
                                    label="Lote"
                                    value={detalle.numeroLote}
                                    onChange={(event) => actualizarRecepcion(
                                        index,
                                        'numeroLote',
                                        event.currentTarget.value,
                                    )}
                                />
                                <TextInput
                                    type="date"
                                    label="Caducidad"
                                    value={detalle.fechaCaducidad}
                                    onChange={(event) => actualizarRecepcion(
                                        index,
                                        'fechaCaducidad',
                                        event.currentTarget.value,
                                    )}
                                />
                                <NumberInput
                                    label="Precio compra"
                                    prefix="$"
                                    decimalScale={2}
                                    value={detalle.precioCompra}
                                    onChange={(value) => actualizarRecepcion(index, 'precioCompra', value)}
                                />
                            </SimpleGrid>
                        </Card>
                    ))}

                    <Textarea
                        label="Observaciones de recepción"
                        value={recepcion?.observaciones ?? ''}
                        onChange={(event) => setRecepcion({
                            ...recepcion,
                            observaciones: event.currentTarget.value,
                        })}
                    />

                    <Group justify="flex-end">
                        <Button variant="default" onClick={closeRecepcion}>Cancelar</Button>
                        <Button onClick={recibirPedido}>
                            Confirmar recepción y aumentar stock
                        </Button>
                    </Group>
                </Stack>
            </Modal>
        </>
    );
}
