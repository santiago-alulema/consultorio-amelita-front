import {
    Button,
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
import { IconEye, IconNotes, IconUserPlus } from '@tabler/icons-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/api';

const consultaVacia = {
    pacienteId: '',
    motivoConsulta: '',
    enfermedadActual: '',
    pesoKg: '',
    tallaCm: '',
    temperatura: '',
    presionArterial: '',
    frecuenciaCardiaca: '',
    saturacionOxigeno: '',
    examenFisico: '',
    diagnostico: '',
    tratamiento: '',
    indicaciones: '',
    observaciones: '',
    valorConsulta: 0,
};

const pacienteVacio = {
    identificacion: '',
    nombres: '',
    apellidos: '',
    fechaNacimiento: '',
    sexo: '',
    tipoSangre: '',
    telefono: '',
    email: '',
    direccion: '',
    contactoEmergencia: '',
    telefonoEmergencia: '',
};

const camposPaciente = [
    ['identificacion', 'Identificación'],
    ['nombres', 'Nombres'],
    ['apellidos', 'Apellidos'],
    ['fechaNacimiento', 'Fecha nacimiento'],
    ['sexo', 'Sexo'],
    ['tipoSangre', 'Tipo sangre'],
    ['telefono', 'Teléfono'],
    ['email', 'Email'],
    ['direccion', 'Dirección'],
    ['contactoEmergencia', 'Contacto emergencia'],
    ['telefonoEmergencia', 'Teléfono emergencia'],
] as const;

function CampoConsulta({ label, value }: { label: string; value: unknown }) {
    return (
        <div>
            <Text size="sm" c="dimmed">
                {label}
            </Text>
            <Text fw={500}>{value || '-'}</Text>
        </div>
    );
}

export default function ConsultasPage() {
    const navigate = useNavigate();
    const [data, setData] = useState<any[]>([]);
    const [pacientes, setPacientes] = useState<any[]>([]);
    const [form, setForm] = useState<any>(consultaVacia);
    const [pacienteForm, setPacienteForm] = useState<any>(pacienteVacio);
    const [consultaSeleccionada, setConsultaSeleccionada] = useState<any>(null);

    const [opened, { open, close }] = useDisclosure();
    const [pacienteOpened, { open: openPaciente, close: closePaciente }] = useDisclosure();
    const [detalleOpened, { open: openDetalle, close: closeDetalle }] = useDisclosure();

    const loadConsultas = async () => {
        const response = await api.get('/consultas');
        setData(response.data);
    };

    const loadPacientes = async () => {
        const response = await api.get('/pacientes');
        setPacientes(response.data);
    };

    useEffect(() => {
        loadConsultas();
        loadPacientes();
    }, []);

    function nuevaConsulta() {
        setForm(consultaVacia);
        open();
    }

    function nuevoPaciente() {
        setPacienteForm(pacienteVacio);
        openPaciente();
    }

    async function guardarPaciente() {
        const response = await api.post('/pacientes', {
            ...pacienteForm,
            fechaNacimiento: pacienteForm.fechaNacimiento || null,
        });

        await loadPacientes();

        setForm((actual: any) => ({
            ...actual,
            pacienteId: String(response.data.id),
        }));

        closePaciente();
    }

    async function guardarConsulta() {
        await api.post('/consultas', {
            ...form,
            pacienteId: Number(form.pacienteId),
            fechaConsulta: new Date().toISOString(),
        });

        close();
        setForm(consultaVacia);
        await loadConsultas();
    }

    async function verConsulta(id: number) {
        const response = await api.get(`/consultas/${id}`);
        setConsultaSeleccionada(response.data);
        openDetalle();
    }

    function emitirReceta(consulta: any) {
        navigate(
            `/recetas?nueva=1&pacienteId=${consulta.pacienteId}&consultaId=${consulta.id}`,
        );
    }

    return (
        <>
            <Group justify="space-between" mb="md">
                <Title order={2}>Consultas</Title>
                <Button onClick={nuevaConsulta}>Registrar consulta</Button>
            </Group>

            <Table striped withTableBorder highlightOnHover>
                <Table.Thead>
                    <Table.Tr>
                        <Table.Th>Fecha</Table.Th>
                        <Table.Th>Paciente</Table.Th>
                        <Table.Th>Motivo</Table.Th>
                        <Table.Th>Diagnóstico</Table.Th>
                        <Table.Th>Valor</Table.Th>
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
                            <Table.Td>{consulta.diagnostico}</Table.Td>
                            <Table.Td>${consulta.valorConsulta}</Table.Td>
                            <Table.Td>
                                <Group gap="xs">
                                    <Button
                                        size="xs"
                                        variant="default"
                                        leftSection={<IconEye size={16} />}
                                        onClick={() => verConsulta(consulta.id)}
                                    >
                                        Ver
                                    </Button>

                                    <Button
                                        size="xs"
                                        variant="light"
                                        leftSection={<IconNotes size={16} />}
                                        onClick={() => emitirReceta(consulta)}
                                    >
                                        Emitir receta
                                    </Button>
                                </Group>
                            </Table.Td>
                        </Table.Tr>
                    ))}
                </Table.Tbody>
            </Table>

            <Modal opened={opened} onClose={close} title="Nueva consulta" size="xl">
                <Group align="flex-end" mb="md" wrap="nowrap">
                    <Select
                        searchable
                        clearable
                        label="Paciente"
                        placeholder="Busque por cédula o nombre"
                        data={pacientes.map((paciente) => ({
                            value: String(paciente.id),
                            label: `${paciente.identificacion} - ${paciente.nombres} ${paciente.apellidos}`,
                        }))}
                        value={form.pacienteId}
                        onChange={(value) =>
                            setForm({ ...form, pacienteId: value ?? '' })
                        }
                        style={{ flex: 1 }}
                    />

                    <Button
                        variant="light"
                        leftSection={<IconUserPlus size={17} />}
                        onClick={nuevoPaciente}
                    >
                        Nuevo paciente
                    </Button>
                </Group>

                <SimpleGrid cols={{ base: 1, sm: 2 }}>
                    <NumberInput
                        label="Valor consulta"
                        decimalScale={2}
                        value={form.valorConsulta}
                        onChange={(value) => setForm({ ...form, valorConsulta: value })}
                    />

                    <TextInput
                        label="Motivo"
                        value={form.motivoConsulta}
                        onChange={(event) =>
                            setForm({
                                ...form,
                                motivoConsulta: event.currentTarget.value,
                            })
                        }
                    />

                    <TextInput
                        label="Presión arterial"
                        value={form.presionArterial}
                        onChange={(event) =>
                            setForm({
                                ...form,
                                presionArterial: event.currentTarget.value,
                            })
                        }
                    />

                    <NumberInput
                        label="Frecuencia cardiaca"
                        value={form.frecuenciaCardiaca}
                        onChange={(value) =>
                            setForm({ ...form, frecuenciaCardiaca: value })
                        }
                    />

                    <NumberInput
                        label="Peso kg"
                        decimalScale={2}
                        value={form.pesoKg}
                        onChange={(value) => setForm({ ...form, pesoKg: value })}
                    />

                    <NumberInput
                        label="Talla cm"
                        decimalScale={2}
                        value={form.tallaCm}
                        onChange={(value) => setForm({ ...form, tallaCm: value })}
                    />

                    <NumberInput
                        label="Temperatura"
                        decimalScale={1}
                        value={form.temperatura}
                        onChange={(value) => setForm({ ...form, temperatura: value })}
                    />

                    <NumberInput
                        label="Saturación O2"
                        value={form.saturacionOxigeno}
                        onChange={(value) =>
                            setForm({ ...form, saturacionOxigeno: value })
                        }
                    />
                </SimpleGrid>

                <Textarea
                    mt="sm"
                    label="Enfermedad actual"
                    value={form.enfermedadActual}
                    onChange={(event) =>
                        setForm({
                            ...form,
                            enfermedadActual: event.currentTarget.value,
                        })
                    }
                />

                <Textarea
                    mt="sm"
                    label="Examen físico"
                    value={form.examenFisico}
                    onChange={(event) =>
                        setForm({ ...form, examenFisico: event.currentTarget.value })
                    }
                />

                <Textarea
                    mt="sm"
                    label="Diagnóstico"
                    value={form.diagnostico}
                    onChange={(event) =>
                        setForm({ ...form, diagnostico: event.currentTarget.value })
                    }
                />

                <Textarea
                    mt="sm"
                    label="Tratamiento"
                    value={form.tratamiento}
                    onChange={(event) =>
                        setForm({ ...form, tratamiento: event.currentTarget.value })
                    }
                />

                <Textarea
                    mt="sm"
                    label="Indicaciones"
                    value={form.indicaciones}
                    onChange={(event) =>
                        setForm({ ...form, indicaciones: event.currentTarget.value })
                    }
                />

                <Textarea
                    mt="sm"
                    label="Observaciones"
                    value={form.observaciones}
                    onChange={(event) =>
                        setForm({ ...form, observaciones: event.currentTarget.value })
                    }
                />

                <Group justify="flex-end" mt="md">
                    <Button variant="default" onClick={close}>
                        Cancelar
                    </Button>
                    <Button onClick={guardarConsulta} disabled={!form.pacienteId}>
                        Guardar consulta
                    </Button>
                </Group>
            </Modal>

            <Modal
                opened={pacienteOpened}
                onClose={closePaciente}
                title="Nuevo paciente"
                size="lg"
                zIndex={1001}
            >
                <SimpleGrid cols={{ base: 1, sm: 2 }}>
                    {camposPaciente.map(([campo, label]) => (
                        <TextInput
                            key={campo}
                            label={label}
                            type={campo === 'fechaNacimiento' ? 'date' : 'text'}
                            value={pacienteForm[campo] ?? ''}
                            onChange={(event) =>
                                setPacienteForm({
                                    ...pacienteForm,
                                    [campo]: event.currentTarget.value,
                                })
                            }
                        />
                    ))}
                </SimpleGrid>

                <Group justify="flex-end" mt="md">
                    <Button variant="default" onClick={closePaciente}>
                        Cancelar
                    </Button>
                    <Button
                        onClick={guardarPaciente}
                        disabled={
                            !pacienteForm.identificacion ||
                            !pacienteForm.nombres ||
                            !pacienteForm.apellidos
                        }
                    >
                        Guardar paciente
                    </Button>
                </Group>
            </Modal>

            <Modal
                opened={detalleOpened}
                onClose={closeDetalle}
                title="Detalle de consulta"
                size="xl"
            >
                {consultaSeleccionada && (
                    <Stack gap="md">
                        <SimpleGrid cols={{ base: 1, sm: 3 }}>
                            <CampoConsulta
                                label="Paciente"
                                value={consultaSeleccionada.paciente}
                            />
                            <CampoConsulta
                                label="Médico"
                                value={consultaSeleccionada.medico}
                            />
                            <CampoConsulta
                                label="Fecha"
                                value={new Date(
                                    consultaSeleccionada.fechaConsulta,
                                ).toLocaleString()}
                            />
                        </SimpleGrid>

                        <Divider />

                        <SimpleGrid cols={{ base: 1, sm: 4 }}>
                            <CampoConsulta
                                label="Peso"
                                value={
                                    consultaSeleccionada.pesoKg
                                        ? `${consultaSeleccionada.pesoKg} kg`
                                        : '-'
                                }
                            />
                            <CampoConsulta
                                label="Talla"
                                value={
                                    consultaSeleccionada.tallaCm
                                        ? `${consultaSeleccionada.tallaCm} cm`
                                        : '-'
                                }
                            />
                            <CampoConsulta
                                label="Temperatura"
                                value={
                                    consultaSeleccionada.temperatura
                                        ? `${consultaSeleccionada.temperatura} °C`
                                        : '-'
                                }
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
                                value={
                                    consultaSeleccionada.saturacionOxigeno
                                        ? `${consultaSeleccionada.saturacionOxigeno}%`
                                        : '-'
                                }
                            />
                            <CampoConsulta
                                label="Valor consulta"
                                value={`$${consultaSeleccionada.valorConsulta}`}
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
                                    emitirReceta(consultaSeleccionada);
                                }}
                            >
                                Emitir receta
                            </Button>
                        </Group>
                    </Stack>
                )}
            </Modal>
        </>
    );
}
