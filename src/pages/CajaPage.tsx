import {
    Badge,
    Button,
    Card,
    Divider,
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
import {
    IconCash,
    IconCashRegister,
    IconLock,
    IconMinus,
    IconPlus,
} from '@tabler/icons-react';
import { useEffect, useMemo, useState } from 'react';
import { api } from '../api/api';

const DENOMINACIONES = [100, 50, 20, 10, 5, 1, 0.5, 0.25, 0.1, 0.05, 0.01];

type Conteo = {
    denominacion: number;
    cantidad: number;
};

const crearConteosVacios = (): Conteo[] => DENOMINACIONES.map((denominacion) => ({
    denominacion,
    cantidad: 0,
}));

export default function CajaPage() {
    const [caja, setCaja] = useState<any>(null);
    const [historial, setHistorial] = useState<any[]>([]);
    const [conteosApertura, setConteosApertura] = useState<Conteo[]>(crearConteosVacios());
    const [conteosCierre, setConteosCierre] = useState<Conteo[]>(crearConteosVacios());
    const [observacionesApertura, setObservacionesApertura] = useState('');
    const [observacionesCierre, setObservacionesCierre] = useState('');
    const [movimiento, setMovimiento] = useState({
        tipo: '2',
        concepto: '',
        monto: 0,
        referencia: '',
    });

    const [aperturaOpened, { open: openApertura, close: closeApertura }] = useDisclosure();
    const [movimientoOpened, { open: openMovimiento, close: closeMovimiento }] = useDisclosure();
    const [cierreOpened, { open: openCierre, close: closeCierre }] = useDisclosure();

    const totalApertura = useMemo(() => calcularTotal(conteosApertura), [conteosApertura]);
    const totalCierre = useMemo(() => calcularTotal(conteosCierre), [conteosCierre]);
    const efectivoEsperado = Number(caja?.efectivoEsperado ?? 0);
    const diferenciaCierre = totalCierre - efectivoEsperado;
    const cajaAbierta = caja?.estado === 'Abierta';

    const load = async () => {
        const [hoyResponse, historialResponse] = await Promise.all([
            api.get('/caja/hoy'),
            api.get('/caja/historial'),
        ]);

        setCaja(hoyResponse.data.existe ? hoyResponse.data.caja : null);
        setHistorial(historialResponse.data);
    };

    useEffect(() => {
        load();
    }, []);

    async function aperturarCaja() {
        await api.post('/caja/aperturar', {
            conteos: conteosApertura,
            observaciones: observacionesApertura || null,
        });

        closeApertura();
        setConteosApertura(crearConteosVacios());
        setObservacionesApertura('');
        await load();
    }

    async function registrarMovimiento() {
        await api.post('/caja/movimientos', {
            tipo: Number(movimiento.tipo),
            concepto: movimiento.concepto,
            monto: movimiento.monto,
            referencia: movimiento.referencia || null,
        });

        closeMovimiento();
        setMovimiento({ tipo: '2', concepto: '', monto: 0, referencia: '' });
        await load();
    }

    function abrirCierre() {
        const conteosActuales = crearConteosVacios().map((item) => {
            const guardado = caja?.conteosCierre?.find(
                (x: any) => Number(x.denominacion) === item.denominacion,
            );

            return {
                ...item,
                cantidad: Number(guardado?.cantidad ?? 0),
            };
        });

        setConteosCierre(conteosActuales);
        setObservacionesCierre('');
        openCierre();
    }

    async function cerrarCaja() {
        await api.post('/caja/cerrar', {
            conteos: conteosCierre,
            observaciones: observacionesCierre || null,
        });

        closeCierre();
        await load();
    }

    return (
        <>
            <div className="page-header">
                <div>
                    <Title order={2}>Apertura y cierre de caja</Title>
                    <Text className="page-subtitle">
                        Control diario de fondo inicial, movimientos, conteo final y diferencias de caja.
                    </Text>
                </div>

                {!caja && (
                    <Button leftSection={<IconCashRegister size={18} />} onClick={openApertura}>
                        Aperturar caja
                    </Button>
                )}

                {cajaAbierta && (
                    <Group>
                        <Button
                            variant="light"
                            leftSection={<IconCash size={18} />}
                            onClick={openMovimiento}
                        >
                            Registrar movimiento
                        </Button>
                        <Button
                            color="red"
                            leftSection={<IconLock size={18} />}
                            onClick={abrirCierre}
                        >
                            Cerrar caja
                        </Button>
                    </Group>
                )}
            </div>

            {!caja ? (
                <Card withBorder radius="md" py="xl">
                    <Stack align="center" gap="xs">
                        <IconCashRegister size={46} stroke={1.4} />
                        <Text fw={700}>Caja aún no aperturada</Text>
                        <Text c="dimmed" ta="center">
                            Cuenta el efectivo disponible por denominación para iniciar la caja del día.
                        </Text>
                        <Button mt="sm" onClick={openApertura}>
                            Aperturar caja de hoy
                        </Button>
                    </Stack>
                </Card>
            ) : (
                <Stack gap="md">
                    <CabeceraCaja caja={caja} />

                    <SimpleGrid cols={{ base: 1, lg: 2 }} spacing="md">
                        <ConteoResumen
                            titulo="Apertura - fondo inicial"
                            conteos={caja.conteosApertura ?? []}
                            total={Number(caja.montoApertura ?? 0)}
                        />

                        <ConteoResumen
                            titulo="Cierre - conteo final"
                            conteos={caja.conteosCierre ?? []}
                            total={Number(caja.montoContado ?? 0)}
                            cierre
                        />
                    </SimpleGrid>

                    <SimpleGrid cols={{ base: 1, lg: 2 }} spacing="md">
                        <MovimientosDia caja={caja} />
                        <ResumenCaja caja={caja} />
                    </SimpleGrid>

                    {(caja.observacionesApertura || caja.observacionesCierre) && (
                        <Card withBorder radius="md">
                            <Text fw={700} mb="xs">Observaciones</Text>
                            {caja.observacionesApertura && (
                                <Text size="sm">
                                    <b>Apertura:</b> {caja.observacionesApertura}
                                </Text>
                            )}
                            {caja.observacionesCierre && (
                                <Text size="sm" mt={4}>
                                    <b>Cierre:</b> {caja.observacionesCierre}
                                </Text>
                            )}
                        </Card>
                    )}
                </Stack>
            )}

            <Card withBorder radius="md" mt="lg">
                <Text fw={700} mb="md">Historial de cajas</Text>
                <div className="table-wrapper">
                    <Table striped highlightOnHover>
                        <Table.Thead>
                            <Table.Tr>
                                <Table.Th>Fecha</Table.Th>
                                <Table.Th>Estado</Table.Th>
                                <Table.Th>Apertura</Table.Th>
                                <Table.Th>Esperado</Table.Th>
                                <Table.Th>Contado</Table.Th>
                                <Table.Th>Diferencia</Table.Th>
                                <Table.Th>Responsable</Table.Th>
                            </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>
                            {historial.map((item) => (
                                <Table.Tr key={item.id}>
                                    <Table.Td>{item.fecha}</Table.Td>
                                    <Table.Td>
                                        <Badge color={item.estado === 'Abierta' ? 'green' : 'gray'}>
                                            {item.estado}
                                        </Badge>
                                    </Table.Td>
                                    <Table.Td>{formatearDinero(item.montoApertura)}</Table.Td>
                                    <Table.Td>{formatearDineroNullable(item.montoEsperado)}</Table.Td>
                                    <Table.Td>{formatearDineroNullable(item.montoContado)}</Table.Td>
                                    <Table.Td>{formatearDineroNullable(item.diferencia)}</Table.Td>
                                    <Table.Td>{item.usuarioApertura}</Table.Td>
                                </Table.Tr>
                            ))}
                        </Table.Tbody>
                    </Table>
                </div>
            </Card>

            <Modal
                opened={aperturaOpened}
                onClose={closeApertura}
                title="Apertura - fondo inicial"
                size="lg"
                centered
            >
                <Stack>
                    <Text size="sm" c="dimmed">
                        Ingresa la cantidad física de billetes y monedas disponibles al iniciar la caja.
                    </Text>

                    <ConteoEditable conteos={conteosApertura} onChange={setConteosApertura} />

                    <Group justify="space-between">
                        <Text fw={700}>Total apertura</Text>
                        <Text fw={800} size="xl">{formatearDinero(totalApertura)}</Text>
                    </Group>

                    <Textarea
                        label="Observaciones"
                        minRows={3}
                        placeholder="Opcional"
                        value={observacionesApertura}
                        onChange={(event) => setObservacionesApertura(event.currentTarget.value)}
                    />

                    <Group justify="flex-end">
                        <Button variant="default" onClick={closeApertura}>Cancelar</Button>
                        <Button onClick={aperturarCaja}>Aperturar caja</Button>
                    </Group>
                </Stack>
            </Modal>

            <Modal
                opened={movimientoOpened}
                onClose={closeMovimiento}
                title="Movimiento de caja"
                centered
            >
                <Stack>
                    <Select
                        label="Tipo"
                        data={[
                            { value: '1', label: 'Otro ingreso en efectivo' },
                            { value: '2', label: 'Gasto pagado en efectivo' },
                            { value: '3', label: 'Retiro / depósito de efectivo' },
                        ]}
                        value={movimiento.tipo}
                        onChange={(value) => setMovimiento({
                            ...movimiento,
                            tipo: value ?? '2',
                        })}
                    />
                    <TextInput
                        label="Concepto"
                        required
                        placeholder="Ej. compra de insumos, retiro para depósito"
                        value={movimiento.concepto}
                        onChange={(event) => setMovimiento({
                            ...movimiento,
                            concepto: event.currentTarget.value,
                        })}
                    />
                    <NumberInput
                        label="Valor"
                        prefix="$"
                        decimalScale={2}
                        min={0}
                        value={movimiento.monto}
                        onChange={(value) => setMovimiento({
                            ...movimiento,
                            monto: Number(value || 0),
                        })}
                    />
                    <TextInput
                        label="Referencia"
                        placeholder="Opcional"
                        value={movimiento.referencia}
                        onChange={(event) => setMovimiento({
                            ...movimiento,
                            referencia: event.currentTarget.value,
                        })}
                    />
                    <Group justify="flex-end">
                        <Button variant="default" onClick={closeMovimiento}>Cancelar</Button>
                        <Button
                            leftSection={movimiento.tipo === '1'
                                ? <IconPlus size={16} />
                                : <IconMinus size={16} />}
                            onClick={registrarMovimiento}
                            disabled={!movimiento.concepto || movimiento.monto <= 0}
                        >
                            Registrar
                        </Button>
                    </Group>
                </Stack>
            </Modal>

            <Modal
                opened={cierreOpened}
                onClose={closeCierre}
                title="Cierre - conteo final"
                size="lg"
                centered
            >
                <Stack>
                    <Text size="sm" c="dimmed">
                        Cuenta el efectivo físico. El sistema comparará el total con el efectivo esperado.
                    </Text>

                    <ConteoEditable conteos={conteosCierre} onChange={setConteosCierre} />

                    <SimpleGrid cols={{ base: 1, sm: 3 }}>
                        <ResumenValor label="Efectivo esperado" value={efectivoEsperado} />
                        <ResumenValor label="Efectivo contado" value={totalCierre} />
                        <ResumenValor label="Diferencia" value={diferenciaCierre} destacar />
                    </SimpleGrid>

                    <Textarea
                        label="Observaciones del cierre"
                        minRows={3}
                        value={observacionesCierre}
                        onChange={(event) => setObservacionesCierre(event.currentTarget.value)}
                    />

                    <Group justify="flex-end">
                        <Button variant="default" onClick={closeCierre}>Cancelar</Button>
                        <Button color="red" onClick={cerrarCaja}>Cerrar caja</Button>
                    </Group>
                </Stack>
            </Modal>
        </>
    );
}

function CabeceraCaja({ caja }: { caja: any }) {
    return (
        <Card withBorder radius="md">
            <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }}>
                <div>
                    <Text size="xs" c="dimmed">Consultorio / farmacia</Text>
                    <Text fw={700}>Consultorio Amelita</Text>
                </div>
                <div>
                    <Text size="xs" c="dimmed">Fecha</Text>
                    <Text fw={700}>{caja.fecha}</Text>
                </div>
                <div>
                    <Text size="xs" c="dimmed">Cajero/a - responsable</Text>
                    <Text fw={700}>{caja.usuarioApertura}</Text>
                </div>
                <div>
                    <Text size="xs" c="dimmed">Turno / estado</Text>
                    <Group gap="xs">
                        <Text fw={700}>Completo</Text>
                        <Badge color={caja.estado === 'Abierta' ? 'green' : 'gray'}>
                            {caja.estado}
                        </Badge>
                    </Group>
                </div>
            </SimpleGrid>

            <Divider my="sm" />

            <SimpleGrid cols={{ base: 1, sm: 3 }}>
                <Text size="sm">
                    <b>Hora apertura:</b> {formatearHora(caja.fechaApertura)}
                </Text>
                <Text size="sm">
                    <b>Hora cierre:</b> {caja.fechaCierre ? formatearHora(caja.fechaCierre) : '-'}
                </Text>
                <Text size="sm"><b>N.º caja:</b> 1</Text>
            </SimpleGrid>
        </Card>
    );
}

function ConteoEditable({
    conteos,
    onChange,
}: {
    conteos: Conteo[];
    onChange: (conteos: Conteo[]) => void;
}) {
    const actualizarCantidad = (index: number, cantidad: number) => {
        onChange(conteos.map((item, currentIndex) => currentIndex === index
            ? { ...item, cantidad }
            : item));
    };

    return (
        <div className="table-wrapper">
            <Table withTableBorder striped>
                <Table.Thead>
                    <Table.Tr>
                        <Table.Th>Denominación</Table.Th>
                        <Table.Th w={150}>Cantidad</Table.Th>
                        <Table.Th ta="right">Total</Table.Th>
                    </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                    {conteos.map((item, index) => (
                        <Table.Tr key={item.denominacion}>
                            <Table.Td>{nombreDenominacion(item.denominacion)}</Table.Td>
                            <Table.Td>
                                <NumberInput
                                    min={0}
                                    allowDecimal={false}
                                    hideControls
                                    value={item.cantidad}
                                    onChange={(value) => actualizarCantidad(index, Number(value || 0))}
                                />
                            </Table.Td>
                            <Table.Td ta="right">
                                {formatearDinero(item.denominacion * item.cantidad)}
                            </Table.Td>
                        </Table.Tr>
                    ))}
                </Table.Tbody>
            </Table>
        </div>
    );
}

function ConteoResumen({
    titulo,
    conteos,
    total,
    cierre = false,
}: {
    titulo: string;
    conteos: any[];
    total: number;
    cierre?: boolean;
}) {
    return (
        <Card withBorder radius="md" p={0} style={{ overflow: 'hidden' }}>
            <div style={{ padding: '10px 14px', background: cierre ? '#dbeafe' : '#dcfce7' }}>
                <Text fw={800} ta="center" c={cierre ? 'blue.8' : 'green.8'}>
                    {titulo.toUpperCase()}
                </Text>
            </div>
            <div className="table-wrapper">
                <Table>
                    <Table.Thead>
                        <Table.Tr>
                            <Table.Th>Denominación</Table.Th>
                            <Table.Th ta="center">Cantidad</Table.Th>
                            <Table.Th ta="right">Total</Table.Th>
                        </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                        {DENOMINACIONES.map((denominacion) => {
                            const item = conteos.find(
                                (x: any) => Number(x.denominacion) === denominacion,
                            );
                            const cantidad = Number(item?.cantidad ?? 0);

                            return (
                                <Table.Tr key={denominacion}>
                                    <Table.Td>{nombreDenominacion(denominacion)}</Table.Td>
                                    <Table.Td ta="center">{cantidad || '-'}</Table.Td>
                                    <Table.Td ta="right">
                                        {formatearDinero(denominacion * cantidad)}
                                    </Table.Td>
                                </Table.Tr>
                            );
                        })}
                        <Table.Tr>
                            <Table.Td colSpan={2}><Text fw={800}>TOTAL</Text></Table.Td>
                            <Table.Td ta="right"><Text fw={800}>{formatearDinero(total)}</Text></Table.Td>
                        </Table.Tr>
                    </Table.Tbody>
                </Table>
            </div>
        </Card>
    );
}

function MovimientosDia({ caja }: { caja: any }) {
    const filas = [
        ['Fondo inicial', caja.montoApertura, 'Sí'],
        ['Ventas / consultas en efectivo', caja.ventasEfectivo, 'Sí'],
        ['Ventas / consultas con tarjeta', caja.ventasTarjeta, 'No'],
        ['Ventas / consultas por transferencia', caja.ventasTransferencia, 'No'],
        ['Otros ingresos en efectivo', caja.otrosIngresosEfectivo, 'Sí'],
        ['Gastos pagados en efectivo', caja.gastosEfectivo, 'Resta'],
        ['Retiros / depósitos de efectivo', caja.retirosEfectivo, 'Resta'],
    ];

    return (
        <Card withBorder radius="md" p={0} style={{ overflow: 'hidden' }}>
            <div style={{ padding: '10px 14px', background: '#e0f2fe' }}>
                <Text fw={800} ta="center" c="blue.8">MOVIMIENTOS DEL DÍA</Text>
            </div>
            <div className="table-wrapper">
                <Table>
                    <Table.Thead>
                        <Table.Tr>
                            <Table.Th>Concepto</Table.Th>
                            <Table.Th ta="right">Valor</Table.Th>
                            <Table.Th>Afecta efectivo</Table.Th>
                        </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                        {filas.map(([concepto, valor, afecta]) => (
                            <Table.Tr key={String(concepto)}>
                                <Table.Td>{concepto}</Table.Td>
                                <Table.Td ta="right">{formatearDinero(Number(valor ?? 0))}</Table.Td>
                                <Table.Td>{afecta}</Table.Td>
                            </Table.Tr>
                        ))}
                    </Table.Tbody>
                </Table>
            </div>
        </Card>
    );
}

function ResumenCaja({ caja }: { caja: any }) {
    const diferencia = caja.estado === 'Cerrada'
        ? Number(caja.diferencia ?? 0)
        : -Number(caja.efectivoEsperado ?? 0);

    return (
        <Card withBorder radius="md">
            <Text fw={800} mb="md">Resumen de caja</Text>
            <Stack gap="xs">
                <ResumenLinea label="Efectivo esperado" value={caja.efectivoEsperado} />
                <ResumenLinea label="Efectivo contado" value={caja.montoContado ?? 0} />
                <ResumenLinea label="Diferencia" value={diferencia} destacado />
                <Divider />
                <Group justify="space-between">
                    <Text fw={700}>Estado</Text>
                    <Badge color={caja.estado === 'Cerrada' ? 'green' : 'yellow'}>
                        {caja.estado === 'Cerrada' ? 'CERRADA' : 'PENDIENTE'}
                    </Badge>
                </Group>
                <ResumenLinea label="Ventas totales" value={caja.ventasTotales} />
                <ResumenLinea label="Ingresos totales" value={caja.ingresosTotales} />
                <ResumenLinea label="Gastos + retiros" value={caja.gastosRetiros} />
            </Stack>
        </Card>
    );
}

function ResumenLinea({
    label,
    value,
    destacado = false,
}: {
    label: string;
    value: number;
    destacado?: boolean;
}) {
    return (
        <Group justify="space-between">
            <Text fw={destacado ? 800 : 600}>{label}</Text>
            <Text fw={destacado ? 800 : 600}>{formatearDinero(Number(value ?? 0))}</Text>
        </Group>
    );
}

function ResumenValor({
    label,
    value,
    destacar = false,
}: {
    label: string;
    value: number;
    destacar?: boolean;
}) {
    return (
        <Card withBorder radius="md">
            <Text size="xs" c="dimmed">{label}</Text>
            <Text fw={destacar ? 800 : 700} size="lg">
                {formatearDinero(value)}
            </Text>
        </Card>
    );
}

function calcularTotal(conteos: Conteo[]) {
    return conteos.reduce(
        (total, item) => total + item.denominacion * item.cantidad,
        0,
    );
}

function nombreDenominacion(denominacion: number) {
    if (denominacion >= 1) {
        return denominacion === 1 ? '$1 moneda' : `$${denominacion.toFixed(0)} billete`;
    }

    return `$${denominacion.toFixed(2).replace('.', ',')} moneda`;
}

function formatearDinero(value: number) {
    return `$${Number(value ?? 0).toFixed(2)}`;
}

function formatearDineroNullable(value: number | null | undefined) {
    return value == null ? '-' : formatearDinero(value);
}

function formatearHora(value: string) {
    return new Date(value).toLocaleTimeString('es-EC', {
        hour: '2-digit',
        minute: '2-digit',
    });
}
