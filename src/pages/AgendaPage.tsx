import {
    Badge,
    Button,
    Card,
    Group,
    Modal,
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
    IconCalendarEvent,
    IconEdit,
    IconMessageCircle,
    IconPlus,
    IconStethoscope,
} from '@tabler/icons-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/api';

const citaVacia = {
    pacienteId: '',
    medicoUsuarioId: '',
    fechaHoraInicio: '',
    fechaHoraFin: '',
    motivo: '',
    observaciones: '',
};

const estados = [
    { value: '1', label: 'Agendada', color: 'blue' },
    { value: '2', label: 'Confirmada', color: 'cyan' },
    { value: '3', label: 'En espera', color: 'yellow' },
    { value: '4', label: 'Atendida', color: 'green' },
    { value: '5', label: 'Anulada', color: 'red' },
    { value: '6', label: 'No asistió', color: 'gray' },
];

function fechaInput(fecha?: string | null) {
    if (!fecha) {
        return '';
    }

    const date = new Date(fecha);
    const offset = date.getTimezoneOffset();
    const local = new Date(date.getTime() - offset * 60_000);

    return local.toISOString().slice(0, 16);
}

function telefonoWhatsapp(telefono?: string | null) {
    if (!telefono) {
        return null;
    }

    const numeros = telefono.replace(/\D/g, '');

    if (numeros.startsWith('593')) {
        return numeros;
    }

    if (numeros.startsWith('0')) {
        return `593${numeros.slice(1)}`;
    }

    return `593${numeros}`;
}

export default function AgendaPage() {
    const navigate = useNavigate();
    const [citas, setCitas] = useState<any[]>([]);
    const [pacientes, setPacientes] = useState<any[]>([]);
    const [medicos, setMedicos] = useState<any[]>([]);
    const [form, setForm] = useState<any>(citaVacia);
    const [editandoId, setEditandoId] = useState<number | null>(null);

    const [opened, { open, close }] = useDisclosure();

    const load = async () => {
        const [citasResponse, pacientesResponse, medicosResponse] = await Promise.all([
            api.get('/citas'),
            api.get('/pacientes'),
            api.get('/citas/medicos'),
        ]);

        setCitas(citasResponse.data);
        setPacientes(pacientesResponse.data);
        setMedicos(medicosResponse.data);
    };

    useEffect(() => {
        load();
    }, []);

    function nuevaCita() {
        const ahora = new Date();
        ahora.setMinutes(Math.ceil(ahora.getMinutes() / 30) * 30, 0, 0);
        const fin = new Date(ahora.getTime() + 30 * 60_000);

        setEditandoId(null);
        setForm({
            ...citaVacia,
            fechaHoraInicio: fechaInput(ahora.toISOString()),
            fechaHoraFin: fechaInput(fin.toISOString()),
        });
        open();
    }

    function editarCita(cita: any) {
        setEditandoId(cita.id);
        setForm({
            pacienteId: String(cita.pacienteId),
            medicoUsuarioId: cita.medicoUsuarioId ? String(cita.medicoUsuarioId) : '',
            fechaHoraInicio: fechaInput(cita.fechaHoraInicio),
            fechaHoraFin: fechaInput(cita.fechaHoraFin),
            motivo: cita.motivo ?? '',
            observaciones: cita.observaciones ?? '',
        });
        open();
    }

    async function guardarCita() {
        const request = {
            pacienteId: Number(form.pacienteId),
            medicoUsuarioId: form.medicoUsuarioId
                ? Number(form.medicoUsuarioId)
                : null,
            fechaHoraInicio: new Date(form.fechaHoraInicio).toISOString(),
            fechaHoraFin: form.fechaHoraFin
                ? new Date(form.fechaHoraFin).toISOString()
                : null,
            motivo: form.motivo,
            observaciones: form.observaciones || null,
        };

        if (editandoId) {
            await api.put(`/citas/${editandoId}`, request);
        } else {
            await api.post('/citas', request);
        }

        close();
        setForm(citaVacia);
        setEditandoId(null);
        await load();
    }

    async function cambiarEstado(cita: any, estado: string | null) {
        if (!estado) {
            return;
        }

        await api.patch(`/citas/${cita.id}/estado`, {
            estado: Number(estado),
        });

        await load();
    }

    function abrirWhatsapp(cita: any) {
        const telefono = telefonoWhatsapp(cita.telefono);

        if (!telefono) {
            return;
        }

        const fecha = new Date(cita.fechaHoraInicio).toLocaleString([], {
            dateStyle: 'long',
            timeStyle: 'short',
        });

        const mensaje = encodeURIComponent(
            `Hola ${cita.paciente}, le recordamos su cita en Consultorio Amelita para ${fecha}. Motivo: ${cita.motivo}.`,
        );

        window.open(`https://wa.me/${telefono}?text=${mensaje}`, '_blank', 'noopener,noreferrer');
    }

    function registrarConsulta(cita: any) {
        navigate(`/consultas?nueva=1&pacienteId=${cita.pacienteId}&citaId=${cita.id}`);
    }

    function colorEstado(estadoId: number) {
        return estados.find((item) => Number(item.value) === estadoId)?.color ?? 'gray';
    }

    return (
        <>
            <div className="page-header">
                <div>
                    <Title order={2}>Agenda</Title>
                    <Text className="page-subtitle">
                        Agenda, confirma, reagenda y convierte una cita directamente en consulta.
                    </Text>
                </div>

                <Button leftSection={<IconPlus size={17} />} onClick={nuevaCita}>
                    Nueva cita
                </Button>
            </div>

            <Card withBorder radius="md" mb="md">
                <Group gap="xs">
                    <IconCalendarEvent size={20} />
                    <Text fw={700}>Citas registradas</Text>
                    <Badge variant="light">{citas.length}</Badge>
                </Group>
            </Card>

            <div className="table-wrapper">
                <Table striped highlightOnHover>
                    <Table.Thead>
                        <Table.Tr>
                            <Table.Th>Fecha y hora</Table.Th>
                            <Table.Th>Paciente</Table.Th>
                            <Table.Th>Médico</Table.Th>
                            <Table.Th>Motivo</Table.Th>
                            <Table.Th>Estado</Table.Th>
                            <Table.Th>Acciones</Table.Th>
                        </Table.Tr>
                    </Table.Thead>

                    <Table.Tbody>
                        {citas.map((cita) => (
                            <Table.Tr key={cita.id}>
                                <Table.Td>
                                    <Text fw={600}>
                                        {new Date(cita.fechaHoraInicio).toLocaleDateString()}
                                    </Text>
                                    <Text size="sm" c="dimmed">
                                        {new Date(cita.fechaHoraInicio).toLocaleTimeString([], {
                                            hour: '2-digit',
                                            minute: '2-digit',
                                        })}
                                    </Text>
                                </Table.Td>
                                <Table.Td>
                                    <Text fw={600}>{cita.paciente}</Text>
                                    <Text size="xs" c="dimmed">{cita.telefono || 'Sin teléfono'}</Text>
                                </Table.Td>
                                <Table.Td>{cita.medico || 'Sin asignar'}</Table.Td>
                                <Table.Td>{cita.motivo}</Table.Td>
                                <Table.Td>
                                    <Badge color={colorEstado(cita.estadoId)}>
                                        {cita.estado}
                                    </Badge>
                                </Table.Td>
                                <Table.Td>
                                    <Group gap="xs" wrap="nowrap">
                                        <Button
                                            size="xs"
                                            variant="default"
                                            leftSection={<IconEdit size={15} />}
                                            onClick={() => editarCita(cita)}
                                            disabled={cita.estadoId === 4 || cita.estadoId === 5}
                                        >
                                            Reagendar
                                        </Button>

                                        <Button
                                            size="xs"
                                            variant="light"
                                            color="green"
                                            leftSection={<IconMessageCircle size={15} />}
                                            onClick={() => abrirWhatsapp(cita)}
                                            disabled={!cita.telefono}
                                        >
                                            WhatsApp
                                        </Button>

                                        {!cita.consultaId && cita.estadoId !== 5 && (
                                            <Button
                                                size="xs"
                                                leftSection={<IconStethoscope size={15} />}
                                                onClick={() => registrarConsulta(cita)}
                                            >
                                                Consulta
                                            </Button>
                                        )}
                                    </Group>

                                    <Select
                                        mt="xs"
                                        size="xs"
                                        w={150}
                                        data={estados.map((item) => ({
                                            value: item.value,
                                            label: item.label,
                                        }))}
                                        value={String(cita.estadoId)}
                                        onChange={(value) => cambiarEstado(cita, value)}
                                        disabled={cita.estadoId === 4}
                                    />
                                </Table.Td>
                            </Table.Tr>
                        ))}
                    </Table.Tbody>
                </Table>
            </div>

            <Modal
                opened={opened}
                onClose={close}
                title={editandoId ? 'Reagendar / editar cita' : 'Nueva cita'}
                size="lg"
            >
                <Stack>
                    <Select
                        searchable
                        required
                        label="Paciente"
                        placeholder="Buscar paciente"
                        data={pacientes.map((paciente) => ({
                            value: String(paciente.id),
                            label: `${paciente.identificacion} - ${paciente.nombres} ${paciente.apellidos}`,
                        }))}
                        value={form.pacienteId}
                        onChange={(value) => setForm({ ...form, pacienteId: value ?? '' })}
                    />

                    <Select
                        clearable
                        searchable
                        label="Médico"
                        placeholder="Asignar médico"
                        data={medicos.map((medico) => ({
                            value: String(medico.id),
                            label: medico.nombre,
                        }))}
                        value={form.medicoUsuarioId || null}
                        onChange={(value) => setForm({ ...form, medicoUsuarioId: value ?? '' })}
                    />

                    <SimpleGrid cols={{ base: 1, sm: 2 }}>
                        <TextInput
                            type="datetime-local"
                            label="Inicio"
                            required
                            value={form.fechaHoraInicio}
                            onChange={(event) => setForm({
                                ...form,
                                fechaHoraInicio: event.currentTarget.value,
                            })}
                        />
                        <TextInput
                            type="datetime-local"
                            label="Fin"
                            value={form.fechaHoraFin}
                            onChange={(event) => setForm({
                                ...form,
                                fechaHoraFin: event.currentTarget.value,
                            })}
                        />
                    </SimpleGrid>

                    <TextInput
                        label="Motivo"
                        required
                        value={form.motivo}
                        onChange={(event) => setForm({ ...form, motivo: event.currentTarget.value })}
                    />

                    <Textarea
                        label="Observaciones"
                        autosize
                        minRows={3}
                        value={form.observaciones}
                        onChange={(event) => setForm({
                            ...form,
                            observaciones: event.currentTarget.value,
                        })}
                    />

                    <Group justify="flex-end">
                        <Button variant="default" onClick={close}>Cancelar</Button>
                        <Button
                            onClick={guardarCita}
                            disabled={!form.pacienteId || !form.fechaHoraInicio || !form.motivo}
                        >
                            {editandoId ? 'Guardar cambios' : 'Agendar cita'}
                        </Button>
                    </Group>
                </Stack>
            </Modal>
        </>
    );
}
