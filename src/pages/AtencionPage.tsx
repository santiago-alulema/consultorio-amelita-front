import {
    Alert,
    Button,
    Card,
    Divider,
    Group,
    Modal,
    NumberInput,
    Select,
    SimpleGrid,
    Stack,
    Stepper,
    Text,
    Textarea,
    TextInput,
    Title,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import {
    IconArrowLeft,
    IconCheck,
    IconPill,
    IconPlus,
    IconPrinter,
    IconUserPlus,
} from '@tabler/icons-react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../api/api';

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

const historiaVacia = {
    alergias: '',
    antecedentesPersonales: '',
    antecedentesFamiliares: '',
    cirugias: '',
    medicacionHabitual: '',
    observaciones: '',
};

const consultaVacia = {
    motivoConsulta: '',
    enfermedadActual: '',
    pesoKg: '' as string | number,
    tallaCm: '' as string | number,
    temperatura: '' as string | number,
    presionArterial: '',
    frecuenciaCardiaca: '' as string | number,
    saturacionOxigeno: '' as string | number,
    examenFisico: '',
    diagnostico: '',
    observaciones: '',
    valorConsulta: 0 as string | number,
    formaPago: 'Efectivo',
};

function medicamentoVacio() {
    return {
        productoId: null as string | null,
        medicamento: '',
        presentacion: '',
        dosis: '',
        frecuencia: '',
        duracion: '',
        cantidad: '' as string | number,
        indicaciones: '',
    };
}

function descargarBlob(blob: Blob, nombre: string) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = nombre;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

export default function AtencionPage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [active, setActive] = useState(0);
    const [pacientes, setPacientes] = useState<any[]>([]);
    const [productos, setProductos] = useState<any[]>([]);
    const [pacienteId, setPacienteId] = useState<string | null>(
        searchParams.get('pacienteId'),
    );
    const [crearPaciente, setCrearPaciente] = useState(
        searchParams.get('nuevo') === '1' || !searchParams.get('pacienteId'),
    );
    const [pacienteForm, setPacienteForm] = useState<any>(pacienteVacio);
    const [historiaId, setHistoriaId] = useState<number | null>(null);
    const [historia, setHistoria] = useState<any>(historiaVacia);
    const [consulta, setConsulta] = useState<any>(consultaVacia);
    const [medicamentos, setMedicamentos] = useState<any[]>([medicamentoVacio()]);
    const [recetaId, setRecetaId] = useState<number | null>(null);
    const [finalOpened, { open: openFinal, close: closeFinal }] = useDisclosure();

    const citaId = searchParams.get('citaId');

    useEffect(() => {
        Promise.all([api.get('/pacientes'), api.get('/productos')]).then(
            ([pacientesResponse, productosResponse]) => {
                setPacientes(pacientesResponse.data);
                setProductos(productosResponse.data);
            },
        );
    }, []);

    useEffect(() => {
        if (!pacienteId) {
            setHistoriaId(null);
            setHistoria(historiaVacia);
            return;
        }

        api.get(`/historias-clinicas/paciente/${pacienteId}`).then((response) => {
            const actual = response.data?.[0];

            if (!actual) {
                setHistoriaId(null);
                setHistoria(historiaVacia);
                return;
            }

            setHistoriaId(actual.id);
            setHistoria({
                alergias: actual.alergias ?? '',
                antecedentesPersonales: actual.antecedentesPersonales ?? '',
                antecedentesFamiliares: actual.antecedentesFamiliares ?? '',
                cirugias: actual.cirugias ?? '',
                medicacionHabitual: actual.medicacionHabitual ?? '',
                observaciones: actual.observaciones ?? '',
            });
        });
    }, [pacienteId]);

    const pacienteSeleccionado = useMemo(
        () => pacientes.find((item) => item.id === Number(pacienteId)),
        [pacientes, pacienteId],
    );

    async function guardarPacienteYSiguiente() {
        if (crearPaciente) {
            const response = await api.post('/pacientes', {
                ...pacienteForm,
                fechaNacimiento: pacienteForm.fechaNacimiento || null,
            });

            const id = Number(response.data.id);
            setPacienteId(String(id));

            const pacientesResponse = await api.get('/pacientes');
            setPacientes(pacientesResponse.data);
            setCrearPaciente(false);
        }

        if (!pacienteId && !crearPaciente) {
            return;
        }

        setActive(1);
    }

    async function guardarHistoriaYSiguiente() {
        if (!pacienteId) {
            return;
        }

        const request = {
            ...historia,
            pacienteId: Number(pacienteId),
        };

        if (historiaId) {
            await api.put(`/historias-clinicas/${historiaId}`, request);
        } else {
            const response = await api.post('/historias-clinicas', request);
            setHistoriaId(Number(response.data.id));
        }

        setActive(2);
    }

    function actualizarMedicamento(index: number, campo: string, valor: any) {
        const nuevos = [...medicamentos];
        nuevos[index] = { ...nuevos[index], [campo]: valor };

        if (campo === 'productoId') {
            const producto = productos.find((item) => item.id === Number(valor));

            if (producto) {
                nuevos[index].medicamento = producto.nombre;
                nuevos[index].presentacion = [
                    producto.concentracion,
                    producto.presentacion,
                ]
                    .filter(Boolean)
                    .join(' ');
            }
        }

        setMedicamentos(nuevos);
    }

    function agregarMedicamento() {
        setMedicamentos((actual) => [...actual, medicamentoVacio()]);
    }

    function quitarMedicamento(index: number) {
        if (medicamentos.length === 1) {
            setMedicamentos([medicamentoVacio()]);
            return;
        }

        setMedicamentos((actual) => actual.filter((_, itemIndex) => itemIndex !== index));
    }

    async function guardarAtencion() {
        if (!pacienteId) {
            return;
        }

        const medicamentosValidos = medicamentos.filter((item) => item.medicamento.trim());
        const tratamiento = medicamentosValidos
            .map((item) => item.medicamento)
            .join(', ');
        const indicaciones = medicamentosValidos
            .map((item) => [item.medicamento, item.indicaciones].filter(Boolean).join(': '))
            .filter(Boolean)
            .join('\n');

        const consultaResponse = await api.post('/consultas', {
            ...consulta,
            pacienteId: Number(pacienteId),
            citaId: citaId ? Number(citaId) : null,
            fechaConsulta: new Date().toISOString(),
            tratamiento: tratamiento || null,
            indicaciones: indicaciones || null,
            pesoKg: consulta.pesoKg === '' ? null : Number(consulta.pesoKg),
            tallaCm: consulta.tallaCm === '' ? null : Number(consulta.tallaCm),
            temperatura: consulta.temperatura === '' ? null : Number(consulta.temperatura),
            frecuenciaCardiaca: consulta.frecuenciaCardiaca === ''
                ? null
                : Number(consulta.frecuenciaCardiaca),
            saturacionOxigeno: consulta.saturacionOxigeno === ''
                ? null
                : Number(consulta.saturacionOxigeno),
            valorConsulta: Number(consulta.valorConsulta || 0),
            presionArterial: consulta.presionArterial || null,
        });

        const consultaId = Number(consultaResponse.data.id);

        if (medicamentosValidos.length > 0) {
            const recetaResponse = await api.post('/recetas', {
                pacienteId: Number(pacienteId),
                consultaId,
                indicacionesGenerales: null,
                detalles: medicamentosValidos.map((item) => ({
                    productoId: item.productoId ? Number(item.productoId) : null,
                    medicamento: item.medicamento,
                    presentacion: item.presentacion || null,
                    dosis: item.dosis || '',
                    frecuencia: item.frecuencia || '',
                    duracion: item.duracion || '',
                    cantidad: item.cantidad === '' ? null : Number(item.cantidad),
                    indicaciones: item.indicaciones || null,
                })),
            });

            setRecetaId(Number(recetaResponse.data.id));
        } else {
            setRecetaId(null);
        }

        openFinal();
    }

    async function imprimirReceta() {
        if (!recetaId) {
            return;
        }

        const response = await api.get(`/recetas/${recetaId}/pdf`, {
            responseType: 'blob',
        });

        descargarBlob(response.data, `receta_${recetaId}.pdf`);
    }

    return (
        <>
            <div className="page-header">
                <div>
                    <Title order={2}>Nueva atención</Title>
                    <Text className="page-subtitle">
                        Registra paciente, historia clínica, consulta y receta en un solo flujo.
                    </Text>
                </div>

                <Button
                    variant="default"
                    leftSection={<IconArrowLeft size={17} />}
                    onClick={() => navigate('/consultas')}
                >
                    Volver
                </Button>
            </div>

            {citaId && (
                <Alert mb="md" color="blue" title={`Atención vinculada a cita #${citaId}`}>
                    Al guardar la consulta, la cita quedará marcada como atendida.
                </Alert>
            )}

            <Card withBorder radius="md" p={{ base: 'md', md: 'xl' }}>
                <Stepper active={active} onStepClick={setActive} allowNextStepsSelect={false}>
                    <Stepper.Step label="Paciente" description="Datos personales">
                        <Stack mt="xl">
                            <Group justify="space-between" align="flex-end">
                                {!crearPaciente && (
                                    <Select
                                        searchable
                                        clearable
                                        label="Paciente registrado"
                                        placeholder="Buscar por cédula o nombre"
                                        data={pacientes.map((paciente) => ({
                                            value: String(paciente.id),
                                            label: `${paciente.identificacion} - ${paciente.nombres} ${paciente.apellidos}`,
                                        }))}
                                        value={pacienteId}
                                        onChange={setPacienteId}
                                        style={{ flex: 1, minWidth: 250 }}
                                    />
                                )}

                                <Button
                                    variant="light"
                                    leftSection={<IconUserPlus size={17} />}
                                    onClick={() => {
                                        setCrearPaciente((actual) => !actual);
                                        setPacienteId(null);
                                    }}
                                >
                                    {crearPaciente ? 'Seleccionar existente' : 'Paciente nuevo'}
                                </Button>
                            </Group>

                            {crearPaciente && (
                                <>
                                    <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }}>
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
                                            label="Fecha de nacimiento"
                                            type="date"
                                            value={pacienteForm.fechaNacimiento}
                                            onChange={(event) => setPacienteForm({
                                                ...pacienteForm,
                                                fechaNacimiento: event.currentTarget.value,
                                            })}
                                        />
                                        <Select
                                            label="Sexo"
                                            clearable
                                            data={['Femenino', 'Masculino', 'Otro']}
                                            value={pacienteForm.sexo || null}
                                            onChange={(value) => setPacienteForm({
                                                ...pacienteForm,
                                                sexo: value ?? '',
                                            })}
                                        />
                                        <Select
                                            label="Tipo de sangre"
                                            clearable
                                            data={['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']}
                                            value={pacienteForm.tipoSangre || null}
                                            onChange={(value) => setPacienteForm({
                                                ...pacienteForm,
                                                tipoSangre: value ?? '',
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
                                        <TextInput
                                            label="Contacto de emergencia"
                                            value={pacienteForm.contactoEmergencia}
                                            onChange={(event) => setPacienteForm({
                                                ...pacienteForm,
                                                contactoEmergencia: event.currentTarget.value,
                                            })}
                                        />
                                    </SimpleGrid>

                                    <Textarea
                                        label="Dirección"
                                        autosize
                                        minRows={2}
                                        value={pacienteForm.direccion}
                                        onChange={(event) => setPacienteForm({
                                            ...pacienteForm,
                                            direccion: event.currentTarget.value,
                                        })}
                                    />
                                </>
                            )}

                            {pacienteSeleccionado && !crearPaciente && (
                                <Alert color="teal" title="Paciente seleccionado">
                                    {pacienteSeleccionado.nombres} {pacienteSeleccionado.apellidos} · {pacienteSeleccionado.identificacion}
                                </Alert>
                            )}

                            <Group justify="flex-end">
                                <Button
                                    rightSection={<IconCheck size={16} />}
                                    onClick={guardarPacienteYSiguiente}
                                    disabled={
                                        crearPaciente
                                            ? !pacienteForm.identificacion
                                                || !pacienteForm.nombres
                                                || !pacienteForm.apellidos
                                            : !pacienteId
                                    }
                                >
                                    Guardar y siguiente
                                </Button>
                            </Group>
                        </Stack>
                    </Stepper.Step>

                    <Stepper.Step label="Historia clínica" description="Antecedentes">
                        <Stack mt="xl">
                            <SimpleGrid cols={{ base: 1, md: 2 }}>
                                <Textarea
                                    label="Alergias"
                                    placeholder="Medicamentos, alimentos u otras alergias..."
                                    autosize
                                    minRows={3}
                                    value={historia.alergias}
                                    onChange={(event) => setHistoria({
                                        ...historia,
                                        alergias: event.currentTarget.value,
                                    })}
                                />
                                <Textarea
                                    label="Antecedentes personales"
                                    placeholder="Enfermedades previas, diagnósticos, hábitos..."
                                    autosize
                                    minRows={3}
                                    value={historia.antecedentesPersonales}
                                    onChange={(event) => setHistoria({
                                        ...historia,
                                        antecedentesPersonales: event.currentTarget.value,
                                    })}
                                />
                                <Textarea
                                    label="Antecedentes familiares"
                                    placeholder="Enfermedades relevantes en familiares directos..."
                                    autosize
                                    minRows={3}
                                    value={historia.antecedentesFamiliares}
                                    onChange={(event) => setHistoria({
                                        ...historia,
                                        antecedentesFamiliares: event.currentTarget.value,
                                    })}
                                />
                                <Textarea
                                    label="Cirugías y procedimientos"
                                    autosize
                                    minRows={3}
                                    value={historia.cirugias}
                                    onChange={(event) => setHistoria({
                                        ...historia,
                                        cirugias: event.currentTarget.value,
                                    })}
                                />
                                <Textarea
                                    label="Medicación habitual"
                                    autosize
                                    minRows={3}
                                    value={historia.medicacionHabitual}
                                    onChange={(event) => setHistoria({
                                        ...historia,
                                        medicacionHabitual: event.currentTarget.value,
                                    })}
                                />
                                <Textarea
                                    label="Observaciones"
                                    autosize
                                    minRows={3}
                                    value={historia.observaciones}
                                    onChange={(event) => setHistoria({
                                        ...historia,
                                        observaciones: event.currentTarget.value,
                                    })}
                                />
                            </SimpleGrid>

                            <Group justify="space-between">
                                <Button variant="default" onClick={() => setActive(0)}>
                                    Anterior
                                </Button>
                                <Button onClick={guardarHistoriaYSiguiente}>
                                    Guardar y siguiente
                                </Button>
                            </Group>
                        </Stack>
                    </Stepper.Step>

                    <Stepper.Step label="Consulta y receta" description="Atención médica">
                        <Stack mt="xl" gap="lg">
                            <Card withBorder radius="md">
                                <Text fw={700} mb="md">Motivo y signos vitales</Text>
                                <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }}>
                                    <TextInput
                                        label="Motivo de consulta"
                                        required
                                        value={consulta.motivoConsulta}
                                        onChange={(event) => setConsulta({
                                            ...consulta,
                                            motivoConsulta: event.currentTarget.value,
                                        })}
                                    />
                                    <TextInput
                                        label="Presión arterial (opcional)"
                                        placeholder="Ej. 120/80"
                                        value={consulta.presionArterial}
                                        onChange={(event) => setConsulta({
                                            ...consulta,
                                            presionArterial: event.currentTarget.value,
                                        })}
                                    />
                                    <NumberInput
                                        label="Peso"
                                        suffix=" kg"
                                        decimalScale={2}
                                        value={consulta.pesoKg}
                                        onChange={(value) => setConsulta({ ...consulta, pesoKg: value })}
                                    />
                                    <NumberInput
                                        label="Talla (opcional)"
                                        suffix=" cm"
                                        decimalScale={2}
                                        value={consulta.tallaCm}
                                        onChange={(value) => setConsulta({ ...consulta, tallaCm: value })}
                                    />
                                    <NumberInput
                                        label="Temperatura"
                                        suffix=" °C"
                                        decimalScale={1}
                                        value={consulta.temperatura}
                                        onChange={(value) => setConsulta({ ...consulta, temperatura: value })}
                                    />
                                    <NumberInput
                                        label="Frecuencia cardiaca"
                                        suffix=" lpm"
                                        value={consulta.frecuenciaCardiaca}
                                        onChange={(value) => setConsulta({ ...consulta, frecuenciaCardiaca: value })}
                                    />
                                    <NumberInput
                                        label="Saturación O2"
                                        suffix=" %"
                                        value={consulta.saturacionOxigeno}
                                        onChange={(value) => setConsulta({ ...consulta, saturacionOxigeno: value })}
                                    />
                                </SimpleGrid>
                            </Card>

                            <Card withBorder radius="md">
                                <Text fw={700} mb="md">Evaluación médica</Text>
                                <Stack>
                                    <Textarea
                                        label="Enfermedad actual"
                                        autosize
                                        minRows={3}
                                        value={consulta.enfermedadActual}
                                        onChange={(event) => setConsulta({
                                            ...consulta,
                                            enfermedadActual: event.currentTarget.value,
                                        })}
                                    />
                                    <Textarea
                                        label="Examen físico"
                                        autosize
                                        minRows={3}
                                        value={consulta.examenFisico}
                                        onChange={(event) => setConsulta({
                                            ...consulta,
                                            examenFisico: event.currentTarget.value,
                                        })}
                                    />
                                    <Textarea
                                        label="Diagnóstico"
                                        autosize
                                        minRows={2}
                                        value={consulta.diagnostico}
                                        onChange={(event) => setConsulta({
                                            ...consulta,
                                            diagnostico: event.currentTarget.value,
                                        })}
                                    />
                                    <Textarea
                                        label="Observaciones"
                                        autosize
                                        minRows={2}
                                        value={consulta.observaciones}
                                        onChange={(event) => setConsulta({
                                            ...consulta,
                                            observaciones: event.currentTarget.value,
                                        })}
                                    />
                                </Stack>
                            </Card>

                            <Card withBorder radius="md">
                                <Group justify="space-between" mb="md">
                                    <div>
                                        <Group gap="xs">
                                            <IconPill size={19} />
                                            <Text fw={700}>Medicación e indicaciones</Text>
                                        </Group>
                                        <Text size="sm" c="dimmed">
                                            La medicación registrada aquí se guardará como receta de esta consulta.
                                        </Text>
                                    </div>
                                    <Button
                                        variant="light"
                                        size="sm"
                                        leftSection={<IconPlus size={16} />}
                                        onClick={agregarMedicamento}
                                    >
                                        Agregar medicamento
                                    </Button>
                                </Group>

                                <Stack>
                                    {medicamentos.map((item, index) => (
                                        <Card key={index} withBorder radius="md" bg="gray.0">
                                            <Group justify="space-between" mb="sm">
                                                <Text fw={600}>Medicamento {index + 1}</Text>
                                                <Button
                                                    size="xs"
                                                    variant="subtle"
                                                    color="red"
                                                    onClick={() => quitarMedicamento(index)}
                                                >
                                                    Quitar
                                                </Button>
                                            </Group>

                                            <SimpleGrid cols={{ base: 1, md: 2 }}>
                                                <Select
                                                    searchable
                                                    clearable
                                                    label="Producto"
                                                    placeholder="Buscar medicamento"
                                                    data={productos.map((producto) => ({
                                                        value: String(producto.id),
                                                        label: [
                                                            producto.nombre,
                                                            producto.concentracion,
                                                            producto.presentacion,
                                                        ].filter(Boolean).join(' '),
                                                    }))}
                                                    value={item.productoId}
                                                    onChange={(value) => actualizarMedicamento(
                                                        index,
                                                        'productoId',
                                                        value,
                                                    )}
                                                />
                                                <TextInput
                                                    label="Medicamento"
                                                    value={item.medicamento}
                                                    onChange={(event) => actualizarMedicamento(
                                                        index,
                                                        'medicamento',
                                                        event.currentTarget.value,
                                                    )}
                                                />
                                                <NumberInput
                                                    label="Cantidad"
                                                    min={0}
                                                    decimalScale={2}
                                                    value={item.cantidad}
                                                    onChange={(value) => actualizarMedicamento(
                                                        index,
                                                        'cantidad',
                                                        value,
                                                    )}
                                                />
                                                <TextInput
                                                    label="Dosis"
                                                    placeholder="Ej. 1 tableta"
                                                    value={item.dosis}
                                                    onChange={(event) => actualizarMedicamento(
                                                        index,
                                                        'dosis',
                                                        event.currentTarget.value,
                                                    )}
                                                />
                                                <TextInput
                                                    label="Frecuencia"
                                                    placeholder="Ej. 8 horas"
                                                    value={item.frecuencia}
                                                    onChange={(event) => actualizarMedicamento(
                                                        index,
                                                        'frecuencia',
                                                        event.currentTarget.value,
                                                    )}
                                                />
                                                <TextInput
                                                    label="Duración"
                                                    placeholder="Ej. 5 días"
                                                    value={item.duracion}
                                                    onChange={(event) => actualizarMedicamento(
                                                        index,
                                                        'duracion',
                                                        event.currentTarget.value,
                                                    )}
                                                />
                                            </SimpleGrid>

                                            <Textarea
                                                mt="sm"
                                                label="Indicaciones"
                                                placeholder="Ej. Tomar después de los alimentos..."
                                                autosize
                                                minRows={2}
                                                value={item.indicaciones}
                                                onChange={(event) => actualizarMedicamento(
                                                    index,
                                                    'indicaciones',
                                                    event.currentTarget.value,
                                                )}
                                            />
                                        </Card>
                                    ))}
                                </Stack>
                            </Card>

                            <Card withBorder radius="md">
                                <Text fw={700} mb="md">Cobro de consulta</Text>
                                <SimpleGrid cols={{ base: 1, sm: 2 }}>
                                    <NumberInput
                                        label="Valor consulta"
                                        prefix="$"
                                        decimalScale={2}
                                        min={0}
                                        value={consulta.valorConsulta}
                                        onChange={(value) => setConsulta({
                                            ...consulta,
                                            valorConsulta: value,
                                        })}
                                    />
                                    <Select
                                        label="Forma de pago"
                                        data={['Efectivo', 'Transferencia', 'Tarjeta', 'Otro']}
                                        value={consulta.formaPago}
                                        onChange={(value) => setConsulta({
                                            ...consulta,
                                            formaPago: value ?? 'Efectivo',
                                        })}
                                    />
                                </SimpleGrid>
                            </Card>

                            <Divider />

                            <Group justify="space-between">
                                <Button variant="default" onClick={() => setActive(1)}>
                                    Anterior
                                </Button>
                                <Button
                                    onClick={guardarAtencion}
                                    disabled={!consulta.motivoConsulta}
                                >
                                    Guardar atención
                                </Button>
                            </Group>
                        </Stack>
                    </Stepper.Step>
                </Stepper>
            </Card>

            <Modal
                opened={finalOpened}
                onClose={closeFinal}
                title="Atención guardada"
                centered
            >
                <Stack>
                    <Alert color="green" icon={<IconCheck size={18} />}>
                        La atención se guardó correctamente.
                    </Alert>

                    {recetaId ? (
                        <Text>
                            La receta quedó vinculada a la consulta. Puedes imprimirla ahora o hacerlo más tarde desde Recetas.
                        </Text>
                    ) : (
                        <Text>
                            La consulta se guardó sin receta porque no se registró medicación.
                        </Text>
                    )}

                    <Group justify="flex-end">
                        <Button variant="default" onClick={() => navigate('/consultas')}>
                            Ir a consultas
                        </Button>
                        {recetaId && (
                            <Button
                                leftSection={<IconPrinter size={17} />}
                                onClick={imprimirReceta}
                            >
                                Imprimir receta
                            </Button>
                        )}
                    </Group>
                </Stack>
            </Modal>
        </>
    );
}
