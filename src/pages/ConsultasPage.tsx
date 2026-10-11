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
    IconEye,
    IconNotes,
    IconPlus,
    IconUserPlus,
} from '@tabler/icons-react';
import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../api/api';

const consultaVacia = {
    pacienteId: '',
    citaId: null as string | null,
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
    formaPago: 'Efectivo',
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

function CampoConsulta({ label, value }: { label: string; value: unknown }) {
    return (
        <div className="detail-field">
            <Text size="xs" c="dimmed" fw={600}>
                {label}
            </Text>
            <Text style={{ whiteSpace: 'pre-wrap' }}>{value == null || value === '' ? '-' : String(value)}</Text>
        </div>
    );
}

export default function ConsultasPage() {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
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

    useEffect(() => {
        if (searchParams.get('nueva') !== '1') {
            return;
        }

        setForm({
            ...consultaVacia,
            pacienteId: searchParams.get('pacienteId') ?? '',
            citaId: searchParams.get('citaId'),
        });
        open();
    }, [searchParams]);

    function cerrarConsulta() {
        close();

        if (searchParams.get('nueva')) {
            setSearchParams({}, { replace: true });
        }
    }

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

    async function guardarConsulta(emitirReceta = false) {
        const response = await api.post('/consultas', {
            ...form,
            pacienteId: Number(form.pacienteId),
            citaId: form.citaId ? Number(form.citaId) : null,
            fechaConsulta: new Date().toISOString(),
        });

        const consultaId = Number(response.data.id);
        const pacienteId = Number(form.pacienteId);

        cerrarConsulta();
        setForm(consultaVacia);
        await loadConsultas();

        if (emitirReceta) {
            navigate(`/recetas?nueva=1&pacienteId=${pacienteId}&consultaId=${consultaId}`);
        }
    }

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

    return (
        <>
            <div className="page-header">
                <div>
                    <Title order={2}>Consultas</Title>
                    <Text className="page-subtitle">
                        Registra la atención completa y emite la receta sin salir del flujo de consulta.
                    </Text>
                </div>

                <Button leftSection={<IconPlus size={17} />} onClick={nuevaConsulta}>
                    Registrar consulta
                </Button>
            </div>

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
                                        {consulta.recetaId ? 'Emitida' : 'Pendiente'}
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
                opened={opened}
                onClose={cerrarConsulta}
                title="Registrar consulta"
                size="xl"
            >
                <Stack gap="md">
                    {form.citaId && (
                        <Badge variant="light" size="lg" w="fit-content">
                            Consulta vinculada a cita #{form.citaId}
                        </Badge>
                    )}

                    <Card withBorder radius="md">
                        <Text fw={700} mb="sm">Paciente</Text>
                        <Group align="flex-end" wrap="wrap">
                            <Select
                                searchable
                                clearable
                                label="Paciente"
                                placeholder="Buscar por cédula o nombre"
                                data={pacientes.map((paciente) => ({
                                    value: String(paciente.id),
                                    label: `${paciente.identificacion} - ${paciente.nombres} ${paciente.apellidos}`,
                                }))}
                                value={form.pacienteId}
                                onChange={(value) =>
                                    setForm({ ...form, pacienteId: value ?? '' })
                                }
                                style={{ flex: 1, minWidth: 240 }}
                            />

                            <Button
                                variant="light"
                                leftSection={<IconUserPlus size={17} />}
                                onClick={nuevoPaciente}
                            >
                                Nuevo paciente
                            </Button>
                        </Group>
                    </Card>

                    <Card withBorder radius="md">
                        <Text fw={700} mb="sm">Motivo y signos vitales</Text>

                        <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }}>
                            <TextInput
                                label="Motivo de consulta"
                                required
                                value={form.motivoConsulta}
                                onChange={(event) =>
                                    setForm({ ...form, motivoConsulta: event.currentTarget.value })
                                }
                            />
                            <TextInput
                                label="Presión arterial"
                                placeholder="120/80"
                                value={form.presionArterial}
                                onChange={(event) =>
                                    setForm({ ...form, presionArterial: event.currentTarget.value })
                                }
                            />
                            <NumberInput
                                label="Frecuencia cardiaca"
                                suffix=" lpm"
                                value={form.frecuenciaCardiaca}
                                onChange={(value) => setForm({ ...form, frecuenciaCardiaca: value })}
                            />
                            <NumberInput
                                label="Saturación O2"
                                suffix=" %"
                                value={form.saturacionOxigeno}
                                onChange={(value) => setForm({ ...form, saturacionOxigeno: value })}
                            />
                            <NumberInput
                                label="Peso"
                                suffix=" kg"
                                decimalScale={2}
                                value={form.pesoKg}
                                onChange={(value) => setForm({ ...form, pesoKg: value })}
                            />
                            <NumberInput
                                label="Talla"
                                suffix=" cm"
                                decimalScale={2}
                                value={form.tallaCm}
                                onChange={(value) => setForm({ ...form, tallaCm: value })}
                            />
                            <NumberInput
                                label="Temperatura"
                                suffix=" °C"
                                decimalScale={1}
                                value={form.temperatura}
                                onChange={(value) => setForm({ ...form, temperatura: value })}
                            />
                        </SimpleGrid>
                    </Card>

                    <Card withBorder radius="md">
                        <Text fw={700} mb="sm">Evaluación médica</Text>
                        <Stack gap="sm">
                            <Textarea
                                label="Enfermedad actual"
                                autosize
                                minRows={3}
                                value={form.enfermedadActual}
                                onChange={(event) =>
                                    setForm({ ...form, enfermedadActual: event.currentTarget.value })
                                }
                            />
                            <Textarea
                                label="Examen físico"
                                autosize
                                minRows={3}
                                value={form.examenFisico}
                                onChange={(event) =>
                                    setForm({ ...form, examenFisico: event.currentTarget.value })
                                }
                            />
                            <Textarea
                                label="Diagnóstico"
                                autosize
                                minRows={2}
                                value={form.diagnostico}
                                onChange={(event) =>
                                    setForm({ ...form, diagnostico: event.currentTarget.value })
                                }
                            />
                            <Textarea
                                label="Tratamiento"
                                autosize
                                minRows={3}
                                value={form.tratamiento}
                                onChange={(event) =>
                                    setForm({ ...form, tratamiento: event.currentTarget.value })
                                }
                            />
                            <Textarea
                                label="Indicaciones"
                                autosize
                                minRows={2}
                                value={form.indicaciones}
                                onChange={(event) =>
                                    setForm({ ...form, indicaciones: event.currentTarget.value })
                                }
                            />
                            <Textarea
                                label="Observaciones"
                                autosize
                                minRows={2}
                                value={form.observaciones}
                                onChange={(event) =>
                                    setForm({ ...form, observaciones: event.currentTarget.value })
                                }
                            />
                        </Stack>
                    </Card>

                    <Card withBorder radius="md">
                        <Text fw={700} mb="sm">Cobro de consulta</Text>
                        <SimpleGrid cols={{ base: 1, sm: 2 }}>
                            <NumberInput
                                label="Valor consulta"
                                prefix="$"
                                decimalScale={2}
                                min={0}
                                value={form.valorConsulta}
                                onChange={(value) => setForm({ ...form, valorConsulta: value })}
                            />
                            <Select
                                label="Forma de pago"
                                data={['Efectivo', 'Transferencia', 'Tarjeta', 'Otro']}
                                value={form.formaPago}
                                onChange={(value) => setForm({ ...form, formaPago: value ?? 'Efectivo' })}
                            />
                        </SimpleGrid>
                    </Card>

                    <Group justify="flex-end">
                        <Button variant="default" onClick={cerrarConsulta}>
                            Cancelar
                        </Button>
                        <Button
                            variant="light"
                            onClick={() => guardarConsulta(false)}
                            disabled={!form.pacienteId || !form.motivoConsulta}
                        >
                            Guardar consulta
                        </Button>
                        <Button
                            leftSection={<IconNotes size={17} />}
                            onClick={() => guardarConsulta(true)}
                            disabled={!form.pacienteId || !form.motivoConsulta}
                        >
                            Guardar y emitir receta
                        </Button>
                    </Group>
                </Stack>
            </Modal>

            <Modal
                opened={pacienteOpened}
                onClose={closePaciente}
                title="Nuevo paciente"
                size="lg"
                zIndex={1001}
            >
                <SimpleGrid cols={{ base: 1, sm: 2 }}>
                    <TextInput
                        label="Identificación"
                        required
                        value={pacienteForm.identificacion}
                        onChange={(event) => setPacienteForm({
                            ...pacienteForm,
                            identificacion: event.currentTarget.value,
                        })}
                    />
                    <TextInput
                        label="Fecha de nacimiento"
                        type="date"
                        value={pacienteForm.fechaNacimiento}
                        onChange={(event) => setPacienteForm({
                            ...pacienteForm,
                            fechaNacimiento: event.currentTarget.value,
                        })}
                    />
                    <TextInput
                        label="Nombres"
                        required
                        value={pacienteForm.nombres}
                        onChange={(event) => setPacienteForm({
                            ...pacienteForm,
                            nombres: event.currentTarget.value,
                        })}
                    />
                    <TextInput
                        label="Apellidos"
                        required
                        value={pacienteForm.apellidos}
                        onChange={(event) => setPacienteForm({
                            ...pacienteForm,
                            apellidos: event.currentTarget.value,
                        })}
                    />
                    <TextInput
                        label="Teléfono"
                        value={pacienteForm.telefono}
                        onChange={(event) => setPacienteForm({
                            ...pacienteForm,
                            telefono: event.currentTarget.value,
                        })}
                    />
                    <TextInput
                        label="Correo"
                        value={pacienteForm.email}
                        onChange={(event) => setPacienteForm({
                            ...pacienteForm,
                            email: event.currentTarget.value,
                        })}
                    />
                </SimpleGrid>

                <Textarea
                    mt="sm"
                    label="Dirección"
                    value={pacienteForm.direccion}
                    onChange={(event) => setPacienteForm({
                        ...pacienteForm,
                        direccion: event.currentTarget.value,
                    })}
                />

                <Group justify="flex-end" mt="md">
                    <Button variant="default" onClick={closePaciente}>
                        Cancelar
                    </Button>
                    <Button
                        onClick={guardarPaciente}
                        disabled={
                            !pacienteForm.identificacion
                            || !pacienteForm.nombres
                            || !pacienteForm.apellidos
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
                            <CampoConsulta label="Presión arterial" value={consultaSeleccionada.presionArterial} />
                            <CampoConsulta label="Frecuencia cardiaca" value={consultaSeleccionada.frecuenciaCardiaca} />
                            <CampoConsulta
                                label="Saturación O2"
                                value={consultaSeleccionada.saturacionOxigeno ? `${consultaSeleccionada.saturacionOxigeno}%` : '-'}
                            />
                            <CampoConsulta
                                label="Valor consulta"
                                value={`$${Number(consultaSeleccionada.valorConsulta).toFixed(2)}`}
                            />
                            <CampoConsulta label="Forma de pago" value={consultaSeleccionada.formaPago} />
                        </SimpleGrid>

                        <Divider />

                        <CampoConsulta label="Motivo de consulta" value={consultaSeleccionada.motivoConsulta} />
                        <CampoConsulta label="Enfermedad actual" value={consultaSeleccionada.enfermedadActual} />
                        <CampoConsulta label="Examen físico" value={consultaSeleccionada.examenFisico} />
                        <CampoConsulta label="Diagnóstico" value={consultaSeleccionada.diagnostico} />
                        <CampoConsulta label="Tratamiento" value={consultaSeleccionada.tratamiento} />
                        <CampoConsulta label="Indicaciones" value={consultaSeleccionada.indicaciones} />
                        <CampoConsulta label="Observaciones" value={consultaSeleccionada.observaciones} />

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
        </>
    );
}
