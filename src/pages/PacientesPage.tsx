import {
    Badge,
    Button,
    Card,
    Checkbox,
    Group,
    Modal,
    Select,
    SimpleGrid,
    Stack,
    Table,
    Text,
    TextInput,
    Textarea,
    Title,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import {
    IconEdit,
    IconSearch,
    IconTrash,
    IconUserPlus,
    IconUserCheck,
} from '@tabler/icons-react';
import { useEffect, useState } from 'react';
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

export default function PacientesPage() {
    const [data, setData] = useState<any[]>([]);
    const [buscar, setBuscar] = useState('');
    const [incluirInactivos, setIncluirInactivos] = useState(false);
    const [form, setForm] = useState<any>(pacienteVacio);
    const [editandoId, setEditandoId] = useState<number | null>(null);
    const [pacienteEstado, setPacienteEstado] = useState<any>(null);

    const [opened, { open, close }] = useDisclosure();
    const [estadoOpened, { open: openEstado, close: closeEstado }] = useDisclosure();

    const load = async () => {
        const response = await api.get('/pacientes', {
            params: {
                buscar: buscar || undefined,
                incluirInactivos,
            },
        });

        setData(response.data);
    };

    useEffect(() => {
        load();
    }, [incluirInactivos]);

    function nuevoPaciente() {
        setEditandoId(null);
        setForm(pacienteVacio);
        open();
    }

    function editarPaciente(paciente: any) {
        setEditandoId(paciente.id);
        setForm({
            identificacion: paciente.identificacion ?? '',
            nombres: paciente.nombres ?? '',
            apellidos: paciente.apellidos ?? '',
            fechaNacimiento: paciente.fechaNacimiento ?? '',
            sexo: paciente.sexo ?? '',
            tipoSangre: paciente.tipoSangre ?? '',
            telefono: paciente.telefono ?? '',
            email: paciente.email ?? '',
            direccion: paciente.direccion ?? '',
            contactoEmergencia: paciente.contactoEmergencia ?? '',
            telefonoEmergencia: paciente.telefonoEmergencia ?? '',
        });
        open();
    }

    async function guardarPaciente() {
        const request = {
            ...form,
            fechaNacimiento: form.fechaNacimiento || null,
        };

        if (editandoId) {
            await api.put(`/pacientes/${editandoId}`, request);
        } else {
            await api.post('/pacientes', request);
        }

        close();
        setForm(pacienteVacio);
        setEditandoId(null);
        await load();
    }

    function confirmarEstado(paciente: any) {
        setPacienteEstado(paciente);
        openEstado();
    }

    async function cambiarEstado() {
        if (!pacienteEstado) {
            return;
        }

        await api.patch(`/pacientes/${pacienteEstado.id}/estado`);
        closeEstado();
        setPacienteEstado(null);
        await load();
    }

    return (
        <>
            <div className="page-header">
                <div>
                    <Title order={2}>Pacientes</Title>
                    <Text className="page-subtitle">
                        Administra la información de los pacientes sin eliminar su historial clínico.
                    </Text>
                </div>

                <Button leftSection={<IconUserPlus size={17} />} onClick={nuevoPaciente}>
                    Nuevo paciente
                </Button>
            </div>

            <Card withBorder mb="md" radius="md">
                <Group align="flex-end">
                    <TextInput
                        label="Buscar paciente"
                        placeholder="Cédula, nombres o apellidos"
                        value={buscar}
                        onChange={(event) => setBuscar(event.currentTarget.value)}
                        onKeyDown={(event) => event.key === 'Enter' && load()}
                        style={{ flex: 1, minWidth: 220 }}
                    />

                    <Button
                        variant="light"
                        leftSection={<IconSearch size={17} />}
                        onClick={load}
                    >
                        Buscar
                    </Button>

                    <Checkbox
                        label="Mostrar inactivos"
                        checked={incluirInactivos}
                        onChange={(event) => setIncluirInactivos(event.currentTarget.checked)}
                        mb={8}
                    />
                </Group>
            </Card>

            <div className="table-wrapper">
                <Table striped highlightOnHover>
                    <Table.Thead>
                        <Table.Tr>
                            <Table.Th>Identificación</Table.Th>
                            <Table.Th>Paciente</Table.Th>
                            <Table.Th>Teléfono</Table.Th>
                            <Table.Th>Email</Table.Th>
                            <Table.Th>Estado</Table.Th>
                            <Table.Th>Acciones</Table.Th>
                        </Table.Tr>
                    </Table.Thead>

                    <Table.Tbody>
                        {data.map((paciente) => (
                            <Table.Tr key={paciente.id}>
                                <Table.Td>{paciente.identificacion}</Table.Td>
                                <Table.Td>
                                    <Text fw={600}>
                                        {paciente.nombres} {paciente.apellidos}
                                    </Text>
                                </Table.Td>
                                <Table.Td>{paciente.telefono || '-'}</Table.Td>
                                <Table.Td>{paciente.email || '-'}</Table.Td>
                                <Table.Td>
                                    <Badge color={paciente.esActivo ? 'green' : 'gray'}>
                                        {paciente.esActivo ? 'Activo' : 'Inactivo'}
                                    </Badge>
                                </Table.Td>
                                <Table.Td>
                                    <Group gap="xs" wrap="nowrap">
                                        <Button
                                            size="xs"
                                            variant="light"
                                            leftSection={<IconEdit size={15} />}
                                            onClick={() => editarPaciente(paciente)}
                                        >
                                            Editar
                                        </Button>

                                        <Button
                                            size="xs"
                                            variant={paciente.esActivo ? 'subtle' : 'light'}
                                            color={paciente.esActivo ? 'red' : 'green'}
                                            leftSection={
                                                paciente.esActivo
                                                    ? <IconTrash size={15} />
                                                    : <IconUserCheck size={15} />
                                            }
                                            onClick={() => confirmarEstado(paciente)}
                                        >
                                            {paciente.esActivo ? 'Dar de baja' : 'Reactivar'}
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
                onClose={close}
                title={editandoId ? 'Editar paciente' : 'Nuevo paciente'}
                size="lg"
            >
                <Stack>
                    <SimpleGrid cols={{ base: 1, sm: 2 }}>
                        <TextInput
                            label="Identificación"
                            required
                            value={form.identificacion}
                            onChange={(event) =>
                                setForm({ ...form, identificacion: event.currentTarget.value })
                            }
                        />
                        <TextInput
                            label="Fecha de nacimiento"
                            type="date"
                            value={form.fechaNacimiento}
                            onChange={(event) =>
                                setForm({ ...form, fechaNacimiento: event.currentTarget.value })
                            }
                        />
                        <TextInput
                            label="Nombres"
                            required
                            value={form.nombres}
                            onChange={(event) =>
                                setForm({ ...form, nombres: event.currentTarget.value })
                            }
                        />
                        <TextInput
                            label="Apellidos"
                            required
                            value={form.apellidos}
                            onChange={(event) =>
                                setForm({ ...form, apellidos: event.currentTarget.value })
                            }
                        />
                        <Select
                            label="Sexo"
                            clearable
                            data={['Femenino', 'Masculino', 'Otro']}
                            value={form.sexo || null}
                            onChange={(value) => setForm({ ...form, sexo: value ?? '' })}
                        />
                        <Select
                            label="Tipo de sangre"
                            clearable
                            data={['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']}
                            value={form.tipoSangre || null}
                            onChange={(value) => setForm({ ...form, tipoSangre: value ?? '' })}
                        />
                        <TextInput
                            label="Teléfono"
                            value={form.telefono}
                            onChange={(event) =>
                                setForm({ ...form, telefono: event.currentTarget.value })
                            }
                        />
                        <TextInput
                            label="Correo electrónico"
                            type="email"
                            value={form.email}
                            onChange={(event) =>
                                setForm({ ...form, email: event.currentTarget.value })
                            }
                        />
                        <TextInput
                            label="Contacto de emergencia"
                            value={form.contactoEmergencia}
                            onChange={(event) =>
                                setForm({
                                    ...form,
                                    contactoEmergencia: event.currentTarget.value,
                                })
                            }
                        />
                        <TextInput
                            label="Teléfono de emergencia"
                            value={form.telefonoEmergencia}
                            onChange={(event) =>
                                setForm({
                                    ...form,
                                    telefonoEmergencia: event.currentTarget.value,
                                })
                            }
                        />
                    </SimpleGrid>

                    <Textarea
                        label="Dirección"
                        autosize
                        minRows={2}
                        value={form.direccion}
                        onChange={(event) =>
                            setForm({ ...form, direccion: event.currentTarget.value })
                        }
                    />

                    <Group justify="flex-end">
                        <Button variant="default" onClick={close}>
                            Cancelar
                        </Button>
                        <Button
                            onClick={guardarPaciente}
                            disabled={!form.identificacion || !form.nombres || !form.apellidos}
                        >
                            {editandoId ? 'Guardar cambios' : 'Crear paciente'}
                        </Button>
                    </Group>
                </Stack>
            </Modal>

            <Modal
                opened={estadoOpened}
                onClose={closeEstado}
                title={pacienteEstado?.esActivo ? 'Dar de baja paciente' : 'Reactivar paciente'}
                centered
            >
                <Text>
                    {pacienteEstado?.esActivo
                        ? 'El paciente dejará de aparecer en los listados activos, pero su historia, consultas y recetas se conservarán.'
                        : 'El paciente volverá a estar disponible para consultas, agenda y recetas.'}
                </Text>

                <Group justify="flex-end" mt="lg">
                    <Button variant="default" onClick={closeEstado}>
                        Cancelar
                    </Button>
                    <Button
                        color={pacienteEstado?.esActivo ? 'red' : 'green'}
                        onClick={cambiarEstado}
                    >
                        Confirmar
                    </Button>
                </Group>
            </Modal>
        </>
    );
}
