import {
    Accordion,
    Badge,
    Button,
    Card,
    Divider,
    Group,
    Modal,
    SimpleGrid,
    Stack,
    Table,
    Text,
    TextInput,
    Title,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import {
    IconEye,
    IconHistory,
    IconNotes,
    IconPlus,
    IconSearch,
} from '@tabler/icons-react';
import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../api/api';

function CampoConsulta({ label, value }: { label: string; value: unknown }) {
    return (
        <div className="detail-field">
            <Text size="xs" c="dimmed" fw={600}>
                {label}
            </Text>
            <Text style={{ whiteSpace: 'pre-wrap' }}>
                {value == null || value === '' ? '-' : String(value)}
            </Text>
        </div>
    );
}

export default function ConsultasPage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [data, setData] = useState<any[]>([]);
    const [consultaSeleccionada, setConsultaSeleccionada] = useState<any>(null);
    const [buscarHistorial, setBuscarHistorial] = useState('');
    const [historial, setHistorial] = useState<any[]>([]);

    const [detalleOpened, { open: openDetalle, close: closeDetalle }] = useDisclosure();
    const [historialOpened, { open: openHistorial, close: closeHistorial }] = useDisclosure();

    const loadConsultas = async () => {
        const response = await api.get('/consultas');
        setData(response.data);
    };

    useEffect(() => {
        loadConsultas();
    }, []);

    useEffect(() => {
        if (searchParams.get('nueva') !== '1') {
            return;
        }

        const params = new URLSearchParams();
        const pacienteId = searchParams.get('pacienteId');
        const citaId = searchParams.get('citaId');

        if (pacienteId) {
            params.set('pacienteId', pacienteId);
        }

        if (citaId) {
            params.set('citaId', citaId);
        }

        navigate(`/atencion?${params.toString()}`, { replace: true });
    }, [searchParams, navigate]);

    async function verConsulta(id: number) {
        const response = await api.get(`/consultas/${id}`);
        setConsultaSeleccionada(response.data);
        openDetalle();
    }

    function abrirReceta(consulta: any) {
        if (consulta.recetaId) {
            navigate(`/recetas?ver=${consulta.recetaId}`);
            return;
        }

        navigate(
            `/recetas?nueva=1&pacienteId=${consulta.pacienteId}&consultaId=${consulta.id}`,
        );
    }

    async function buscarAtenciones() {
        if (!buscarHistorial.trim()) {
            return;
        }

        const response = await api.get('/pacientes/historial-atenciones', {
            params: { buscar: buscarHistorial.trim() },
        });

        setHistorial(response.data);
        openHistorial();
    }

    return (
        <>
            <div className="page-header">
                <div>
                    <Title order={2}>Consultas</Title>
                    <Text className="page-subtitle">
                        Registra atenciones y consulta rápidamente el historial completo de cada paciente.
                    </Text>
                </div>

                <Button
                    leftSection={<IconPlus size={17} />}
                    onClick={() => navigate('/atencion')}
                >
                    Nueva atención
                </Button>
            </div>

            <Card withBorder radius="md" mb="md">
                <Group align="flex-end" wrap="wrap">
                    <TextInput
                        label="Buscar historial de atenciones"
                        placeholder="Cédula, nombres o apellidos"
                        value={buscarHistorial}
                        onChange={(event) => setBuscarHistorial(event.currentTarget.value)}
                        onKeyDown={(event) => event.key === 'Enter' && buscarAtenciones()}
                        leftSection={<IconSearch size={16} />}
                        style={{ flex: 1, minWidth: 260 }}
                    />
                    <Button
                        variant="light"
                        leftSection={<IconHistory size={17} />}
                        onClick={buscarAtenciones}
                        disabled={!buscarHistorial.trim()}
                    >
                        Ver historial
                    </Button>
                </Group>
            </Card>

            <div className="table-wrapper">
                <Table striped highlightOnHover>
                    <Table.Thead>
                        <Table.Tr>
                            <Table.Th>Fecha</Table.Th>
                            <Table.Th>Paciente</Table.Th>
                            <Table.Th>Motivo</Table.Th>
                            <Table.Th>Diagnóstico</Table.Th>
                            <Table.Th>Valor</Table.Th>
                            <Table.Th>Receta</Table.Th>
                            <Table.Th>Acciones</Table.Th>
                        </Table.Tr>
                    </Table.Thead>

                    <Table.Tbody>
                        {data.map((consulta) => (
                            <Table.Tr key={consulta.id}>
                                <Table.Td>
                                    {new Date(consulta.fechaConsulta).toLocaleString()}
                                </Table.Td>
                                <Table.Td>{consulta.paciente}</Table.Td>
                                <Table.Td>{consulta.motivoConsulta}</Table.Td>
                                <Table.Td>{consulta.diagnostico || '-'}</Table.Td>
                                <Table.Td>${Number(consulta.valorConsulta).toFixed(2)}</Table.Td>
                                <Table.Td>
                                    <Badge color={consulta.recetaId ? 'green' : 'gray'}>
                                        {consulta.recetaId ? 'Emitida' : 'Sin receta'}
                                    </Badge>
                                </Table.Td>
                                <Table.Td>
                                    <Group gap="xs" wrap="nowrap">
                                        <Button
                                            size="xs"
                                            variant="default"
                                            leftSection={<IconEye size={15} />}
                                            onClick={() => verConsulta(consulta.id)}
                                        >
                                            Ver
                                        </Button>
                                        <Button
                                            size="xs"
                                            variant="light"
                                            leftSection={<IconNotes size={15} />}
                                            onClick={() => abrirReceta(consulta)}
                                        >
                                            {consulta.recetaId ? 'Ver receta' : 'Emitir receta'}
                                        </Button>
                                    </Group>
                                </Table.Td>
                            </Table.Tr>
                        ))}
                    </Table.Tbody>
                </Table>
            </div>

            <Modal
                opened={detalleOpened}
                onClose={closeDetalle}
                title="Detalle de consulta"
                size="xl"
            >
                {consultaSeleccionada && (
                    <Stack gap="md">
                        <SimpleGrid cols={{ base: 1, sm: 3 }}>
                            <CampoConsulta label="Paciente" value={consultaSeleccionada.paciente} />
                            <CampoConsulta label="Médico" value={consultaSeleccionada.medico} />
                            <CampoConsulta
                                label="Fecha"
                                value={new Date(consultaSeleccionada.fechaConsulta).toLocaleString()}
                            />
                        </SimpleGrid>

                        <Divider />

                        <SimpleGrid cols={{ base: 2, sm: 4 }}>
                            <CampoConsulta
                                label="Peso"
                                value={consultaSeleccionada.pesoKg ? `${consultaSeleccionada.pesoKg} kg` : '-'}
                            />
                            <CampoConsulta
                                label="Talla"
                                value={consultaSeleccionada.tallaCm ? `${consultaSeleccionada.tallaCm} cm` : '-'}
                            />
                            <CampoConsulta
                                label="Temperatura"
                                value={consultaSeleccionada.temperatura ? `${consultaSeleccionada.temperatura} °C` : '-'}
                            />
                            <CampoConsulta
                                label="Presión arterial"
                                value={consultaSeleccionada.presionArterial}
                            />
                            <CampoConsulta
                                label="Frecuencia cardiaca"
                                value={consultaSeleccionada.frecuenciaCardiaca}
                            />
                            <CampoConsulta
                                label="Saturación O2"
                                value={consultaSeleccionada.saturacionOxigeno ? `${consultaSeleccionada.saturacionOxigeno}%` : '-'}
                            />
                            <CampoConsulta
                                label="Valor consulta"
                                value={`$${Number(consultaSeleccionada.valorConsulta).toFixed(2)}`}
                            />
                            <CampoConsulta
                                label="Forma de pago"
                                value={consultaSeleccionada.formaPago}
                            />
                        </SimpleGrid>

                        <Divider />

                        <CampoConsulta
                            label="Motivo de consulta"
                            value={consultaSeleccionada.motivoConsulta}
                        />
                        <CampoConsulta
                            label="Enfermedad actual"
                            value={consultaSeleccionada.enfermedadActual}
                        />
                        <CampoConsulta
                            label="Examen físico"
                            value={consultaSeleccionada.examenFisico}
                        />
                        <CampoConsulta
                            label="Diagnóstico"
                            value={consultaSeleccionada.diagnostico}
                        />
                        <CampoConsulta
                            label="Tratamiento"
                            value={consultaSeleccionada.tratamiento}
                        />
                        <CampoConsulta
                            label="Indicaciones"
                            value={consultaSeleccionada.indicaciones}
                        />
                        <CampoConsulta
                            label="Observaciones"
                            value={consultaSeleccionada.observaciones}
                        />

                        <Group justify="flex-end">
                            <Button
                                leftSection={<IconNotes size={16} />}
                                onClick={() => {
                                    closeDetalle();
                                    abrirReceta(consultaSeleccionada);
                                }}
                            >
                                {consultaSeleccionada.recetaId ? 'Ver receta' : 'Emitir receta'}
                            </Button>
                        </Group>
                    </Stack>
                )}
            </Modal>

            <Modal
                opened={historialOpened}
                onClose={closeHistorial}
                title="Historial de atenciones"
                size="xl"
            >
                {historial.length === 0 ? (
                    <Text c="dimmed">No se encontraron pacientes con ese criterio.</Text>
                ) : (
                    <Accordion variant="separated">
                        {historial.map((paciente) => (
                            <Accordion.Item key={paciente.id} value={String(paciente.id)}>
                                <Accordion.Control>
                                    <Group justify="space-between" pr="md">
                                        <div>
                                            <Text fw={700}>
                                                {paciente.nombres} {paciente.apellidos}
                                            </Text>
                                            <Text size="sm" c="dimmed">
                                                {paciente.identificacion}
                                            </Text>
                                        </div>
                                        <Badge variant="light">
                                            {paciente.consultas.length} atención(es)
                                        </Badge>
                                    </Group>
                                </Accordion.Control>
                                <Accordion.Panel>
                                    {paciente.consultas.length === 0 ? (
                                        <Text c="dimmed">Este paciente aún no tiene consultas registradas.</Text>
                                    ) : (
                                        <Stack>
                                            {paciente.consultas.map((consulta: any) => (
                                                <Card key={consulta.id} withBorder radius="md">
                                                    <Group justify="space-between" align="flex-start">
                                                        <div>
                                                            <Text fw={700}>
                                                                {new Date(consulta.fechaConsulta).toLocaleString()}
                                                            </Text>
                                                            <Text size="sm">
                                                                {consulta.motivoConsulta}
                                                            </Text>
                                                            <Text size="sm" c="dimmed">
                                                                Diagnóstico: {consulta.diagnostico || '-'}
                                                            </Text>
                                                        </div>
                                                        <Group gap="xs">
                                                            <Button
                                                                size="xs"
                                                                variant="default"
                                                                onClick={() => {
                                                                    closeHistorial();
                                                                    verConsulta(consulta.id);
                                                                }}
                                                            >
                                                                Ver consulta
                                                            </Button>
                                                            {consulta.recetaId && (
                                                                <Button
                                                                    size="xs"
                                                                    variant="light"
                                                                    onClick={() => navigate(`/recetas?ver=${consulta.recetaId}`)}
                                                                >
                                                                    Ver receta
                                                                </Button>
                                                            )}
                                                        </Group>
                                                    </Group>
                                                </Card>
                                            ))}
                                        </Stack>
                                    )}
                                </Accordion.Panel>
                            </Accordion.Item>
                        ))}
                    </Accordion>
                )}
            </Modal>
        </>
    );
}
