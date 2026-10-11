import {
    Accordion,
    Badge,
    Button,
    Card,
    Grid,
    Group,
    Select,
    SimpleGrid,
    Stack,
    Text,
    Textarea,
    Title,
} from '@mantine/core';
import { IconHeartbeat, IconHistory, IconPlus } from '@tabler/icons-react';
import { useEffect, useMemo, useState } from 'react';
import { api } from '../api/api';

const historiaVacia = {
    alergias: '',
    antecedentesPersonales: '',
    antecedentesFamiliares: '',
    cirugias: '',
    medicacionHabitual: '',
    observaciones: '',
};

const campos = [
    {
        key: 'alergias',
        label: 'Alergias',
        placeholder: 'Medicamentos, alimentos u otras alergias conocidas...',
    },
    {
        key: 'antecedentesPersonales',
        label: 'Antecedentes personales',
        placeholder: 'Enfermedades previas, diagnósticos importantes, hábitos...',
    },
    {
        key: 'antecedentesFamiliares',
        label: 'Antecedentes familiares',
        placeholder: 'Enfermedades relevantes en familiares directos...',
    },
    {
        key: 'cirugias',
        label: 'Cirugías y procedimientos',
        placeholder: 'Cirugías previas, procedimientos y fechas aproximadas...',
    },
    {
        key: 'medicacionHabitual',
        label: 'Medicación habitual',
        placeholder: 'Medicamentos de uso permanente, dosis y frecuencia...',
    },
    {
        key: 'observaciones',
        label: 'Observaciones',
        placeholder: 'Información adicional relevante para futuras atenciones...',
    },
] as const;

export default function HistoriasClinicasPage() {
    const [pacientes, setPacientes] = useState<any[]>([]);
    const [pacienteId, setPacienteId] = useState<string | null>(null);
    const [historias, setHistorias] = useState<any[]>([]);
    const [form, setForm] = useState<any>(historiaVacia);

    useEffect(() => {
        api.get('/pacientes').then((response) => setPacientes(response.data));
    }, []);

    const paciente = useMemo(
        () => pacientes.find((item) => item.id === Number(pacienteId)),
        [pacientes, pacienteId],
    );

    async function cargarHistoria(id: string | null) {
        setPacienteId(id);
        setForm(historiaVacia);

        if (!id) {
            setHistorias([]);
            return;
        }

        const response = await api.get(`/historias-clinicas/paciente/${id}`);
        setHistorias(response.data);
    }

    async function guardarHistoria() {
        if (!pacienteId) {
            return;
        }

        await api.post('/historias-clinicas', {
            ...form,
            pacienteId: Number(pacienteId),
        });

        setForm(historiaVacia);
        await cargarHistoria(pacienteId);
    }

    return (
        <>
            <div className="page-header">
                <div>
                    <Title order={2}>Historia clínica</Title>
                    <Text className="page-subtitle">
                        Consulta los antecedentes del paciente y registra nuevas actualizaciones clínicas.
                    </Text>
                </div>
            </div>

            <Card withBorder radius="md" mb="md">
                <Select
                    searchable
                    clearable
                    label="Paciente"
                    placeholder="Buscar por cédula o nombre"
                    data={pacientes.map((item) => ({
                        value: String(item.id),
                        label: `${item.identificacion} - ${item.nombres} ${item.apellidos}`,
                    }))}
                    value={pacienteId}
                    onChange={cargarHistoria}
                />

                {paciente && (
                    <SimpleGrid cols={{ base: 1, sm: 3 }} mt="md">
                        <div className="detail-field">
                            <Text size="xs" c="dimmed">Paciente</Text>
                            <Text fw={600}>{paciente.nombres} {paciente.apellidos}</Text>
                        </div>
                        <div className="detail-field">
                            <Text size="xs" c="dimmed">Identificación</Text>
                            <Text fw={600}>{paciente.identificacion}</Text>
                        </div>
                        <div className="detail-field">
                            <Text size="xs" c="dimmed">Tipo de sangre</Text>
                            <Text fw={600}>{paciente.tipoSangre || 'No registrado'}</Text>
                        </div>
                    </SimpleGrid>
                )}
            </Card>

            {!pacienteId ? (
                <Card withBorder radius="md" py="xl">
                    <Stack align="center" gap="xs">
                        <IconHeartbeat size={42} stroke={1.5} />
                        <Text fw={600}>Seleccione un paciente</Text>
                        <Text c="dimmed" ta="center">
                            Al seleccionar un paciente podrás revisar su historial y registrar una nueva actualización.
                        </Text>
                    </Stack>
                </Card>
            ) : (
                <Grid gutter="md">
                    <Grid.Col span={{ base: 12, lg: 5 }}>
                        <Card withBorder radius="md" h="100%">
                            <Group mb="md">
                                <IconPlus size={20} />
                                <div>
                                    <Text fw={700}>Nueva actualización</Text>
                                    <Text size="sm" c="dimmed">
                                        Registra únicamente la información que necesites actualizar.
                                    </Text>
                                </div>
                            </Group>

                            <Stack gap="sm">
                                {campos.map((campo) => (
                                    <Textarea
                                        key={campo.key}
                                        label={campo.label}
                                        placeholder={campo.placeholder}
                                        autosize
                                        minRows={2}
                                        maxRows={6}
                                        value={form[campo.key]}
                                        onChange={(event) =>
                                            setForm({
                                                ...form,
                                                [campo.key]: event.currentTarget.value,
                                            })
                                        }
                                    />
                                ))}

                                <Button onClick={guardarHistoria}>
                                    Guardar en historia clínica
                                </Button>
                            </Stack>
                        </Card>
                    </Grid.Col>

                    <Grid.Col span={{ base: 12, lg: 7 }}>
                        <Card withBorder radius="md">
                            <Group justify="space-between" mb="sm">
                                <Group gap="xs">
                                    <IconHistory size={20} />
                                    <Text fw={700}>Historial registrado</Text>
                                </Group>
                                <Badge variant="light">{historias.length} registros</Badge>
                            </Group>

                            {historias.length === 0 ? (
                                <Text c="dimmed" py="lg" ta="center">
                                    Este paciente todavía no tiene antecedentes registrados.
                                </Text>
                            ) : (
                                <Accordion variant="separated" radius="md">
                                    {historias.map((item, index) => (
                                        <Accordion.Item key={item.id} value={String(item.id)}>
                                            <Accordion.Control>
                                                <Group justify="space-between" pr="md">
                                                    <Text fw={600}>
                                                        Actualización #{historias.length - index}
                                                    </Text>
                                                    <Text size="xs" c="dimmed">
                                                        {new Date(item.fechaCreacion).toLocaleString()}
                                                    </Text>
                                                </Group>
                                            </Accordion.Control>

                                            <Accordion.Panel>
                                                <Stack gap="sm">
                                                    {campos.map((campo) => (
                                                        <div key={campo.key}>
                                                            <Text size="xs" c="dimmed" fw={600}>
                                                                {campo.label}
                                                            </Text>
                                                            <Text style={{ whiteSpace: 'pre-wrap' }}>
                                                                {item[campo.key] || '-'}
                                                            </Text>
                                                        </div>
                                                    ))}
                                                </Stack>
                                            </Accordion.Panel>
                                        </Accordion.Item>
                                    ))}
                                </Accordion>
                            )}
                        </Card>
                    </Grid.Col>
                </Grid>
            )}
        </>
    );
}
