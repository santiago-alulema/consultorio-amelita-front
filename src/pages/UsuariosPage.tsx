import {
    Badge,
    Button,
    Card,
    Group,
    Modal,
    MultiSelect,
    PasswordInput,
    SimpleGrid,
    Stack,
    Table,
    Tabs,
    Text,
    TextInput,
    Textarea,
    Title,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import {
    IconEdit,
    IconKey,
    IconPlus,
    IconShield,
    IconUser,
    IconUserCheck,
    IconUserOff,
} from '@tabler/icons-react';
import { useEffect, useState } from 'react';
import { api } from '../api/api';
import { tienePermiso } from '../services/authService';

const usuarioVacio = {
    nombre: '',
    apellido: '',
    nombreUsuario: '',
    email: '',
    password: '',
    roles: [] as string[],
};

const rolVacio = {
    nombre: '',
    descripcion: '',
    permisos: [] as string[],
};

export default function UsuariosPage() {
    const [usuarios, setUsuarios] = useState<any[]>([]);
    const [roles, setRoles] = useState<any[]>([]);
    const [permisos, setPermisos] = useState<any[]>([]);
    const [usuarioForm, setUsuarioForm] = useState<any>(usuarioVacio);
    const [rolForm, setRolForm] = useState<any>(rolVacio);
    const [usuarioEditandoId, setUsuarioEditandoId] = useState<number | null>(null);
    const [rolEditandoId, setRolEditandoId] = useState<number | null>(null);

    const [usuarioOpened, { open: openUsuario, close: closeUsuario }] = useDisclosure();
    const [rolOpened, { open: openRol, close: closeRol }] = useDisclosure();

    const puedeEditarUsuarios = tienePermiso('USUARIOS_EDITAR');
    const puedeEditarRoles = tienePermiso('ROLES_EDITAR');

    const load = async () => {
        const [usuariosResponse, rolesResponse, permisosResponse] = await Promise.all([
            api.get('/usuarios', { params: { incluirInactivos: true } }),
            api.get('/roles', { params: { incluirInactivos: true } }),
            api.get('/roles/permisos'),
        ]);

        setUsuarios(usuariosResponse.data);
        setRoles(rolesResponse.data);
        setPermisos(permisosResponse.data);
    };

    useEffect(() => {
        load();
    }, []);

    function nuevoUsuario() {
        setUsuarioEditandoId(null);
        setUsuarioForm(usuarioVacio);
        openUsuario();
    }

    function editarUsuario(usuario: any) {
        setUsuarioEditandoId(usuario.id);
        setUsuarioForm({
            nombre: usuario.nombre ?? '',
            apellido: usuario.apellido ?? '',
            nombreUsuario: usuario.nombreUsuario ?? '',
            email: usuario.email ?? '',
            password: '',
            roles: usuario.roles.map((rol: any) => String(rol.rolId)),
        });
        openUsuario();
    }

    async function guardarUsuario() {
        const request = {
            ...usuarioForm,
            password: usuarioForm.password || null,
            roles: usuarioForm.roles.map(Number),
        };

        if (usuarioEditandoId) {
            await api.put(`/usuarios/${usuarioEditandoId}`, request);
        } else {
            await api.post('/usuarios', request);
        }

        closeUsuario();
        setUsuarioForm(usuarioVacio);
        setUsuarioEditandoId(null);
        await load();
    }

    async function cambiarEstadoUsuario(usuario: any) {
        await api.patch(`/usuarios/${usuario.id}/estado`);
        await load();
    }

    function nuevoRol() {
        setRolEditandoId(null);
        setRolForm(rolVacio);
        openRol();
    }

    function editarRol(rol: any) {
        setRolEditandoId(rol.id);
        setRolForm({
            nombre: rol.nombre ?? '',
            descripcion: rol.descripcion ?? '',
            permisos: rol.permisos.map((permiso: any) => String(permiso.permisoId)),
        });
        openRol();
    }

    async function guardarRol() {
        const request = {
            nombre: rolForm.nombre,
            descripcion: rolForm.descripcion || null,
            permisos: rolForm.permisos.map(Number),
        };

        if (rolEditandoId) {
            await api.put(`/roles/${rolEditandoId}`, request);
        } else {
            await api.post('/roles', request);
        }

        closeRol();
        setRolForm(rolVacio);
        setRolEditandoId(null);
        await load();
    }

    async function cambiarEstadoRol(rol: any) {
        await api.patch(`/roles/${rol.id}/estado`);
        await load();
    }

    const permisosAgrupados = permisos.reduce((acc: Record<string, any[]>, permiso) => {
        acc[permiso.modulo] ??= [];
        acc[permiso.modulo].push(permiso);
        return acc;
    }, {});

    const opcionesPermisos = Object.entries(permisosAgrupados).map(([grupo, items]) => ({
        group: grupo,
        items: items.map((permiso) => ({
            value: String(permiso.id),
            label: permiso.nombre,
        })),
    }));

    return (
        <>
            <div className="page-header">
                <div>
                    <Title order={2}>Usuarios y roles</Title>
                    <Text className="page-subtitle">
                        Controla quién ingresa al sistema y qué pantallas puede utilizar.
                    </Text>
                </div>
            </div>

            <Tabs defaultValue="usuarios">
                <Tabs.List mb="md">
                    <Tabs.Tab value="usuarios" leftSection={<IconUser size={16} />}>
                        Usuarios
                    </Tabs.Tab>
                    <Tabs.Tab value="roles" leftSection={<IconShield size={16} />}>
                        Roles y permisos
                    </Tabs.Tab>
                </Tabs.List>

                <Tabs.Panel value="usuarios">
                    <Card withBorder radius="md">
                        <Group justify="space-between" mb="md">
                            <div>
                                <Text fw={700}>Usuarios del sistema</Text>
                                <Text size="sm" c="dimmed">
                                    Puedes editar datos, roles, contraseña y estado.
                                </Text>
                            </div>
                            {puedeEditarUsuarios && (
                                <Button leftSection={<IconPlus size={17} />} onClick={nuevoUsuario}>
                                    Nuevo usuario
                                </Button>
                            )}
                        </Group>

                        <div className="table-wrapper">
                            <Table striped highlightOnHover>
                                <Table.Thead>
                                    <Table.Tr>
                                        <Table.Th>Usuario</Table.Th>
                                        <Table.Th>Nombre</Table.Th>
                                        <Table.Th>Email</Table.Th>
                                        <Table.Th>Roles</Table.Th>
                                        <Table.Th>Estado</Table.Th>
                                        <Table.Th>Acciones</Table.Th>
                                    </Table.Tr>
                                </Table.Thead>
                                <Table.Tbody>
                                    {usuarios.map((usuario) => (
                                        <Table.Tr key={usuario.id}>
                                            <Table.Td>{usuario.nombreUsuario}</Table.Td>
                                            <Table.Td>{usuario.nombre} {usuario.apellido}</Table.Td>
                                            <Table.Td>{usuario.email || '-'}</Table.Td>
                                            <Table.Td>
                                                <Group gap={4}>
                                                    {usuario.roles.map((rol: any) => (
                                                        <Badge key={rol.rolId} variant="light">
                                                            {rol.nombre}
                                                        </Badge>
                                                    ))}
                                                </Group>
                                            </Table.Td>
                                            <Table.Td>
                                                <Badge color={usuario.esActivo ? 'green' : 'gray'}>
                                                    {usuario.esActivo ? 'Activo' : 'Inactivo'}
                                                </Badge>
                                            </Table.Td>
                                            <Table.Td>
                                                {puedeEditarUsuarios && (
                                                    <Group gap="xs" wrap="nowrap">
                                                        <Button
                                                            size="xs"
                                                            variant="light"
                                                            leftSection={<IconEdit size={15} />}
                                                            onClick={() => editarUsuario(usuario)}
                                                        >
                                                            Editar
                                                        </Button>
                                                        <Button
                                                            size="xs"
                                                            variant="subtle"
                                                            color={usuario.esActivo ? 'red' : 'green'}
                                                            leftSection={usuario.esActivo
                                                                ? <IconUserOff size={15} />
                                                                : <IconUserCheck size={15} />}
                                                            onClick={() => cambiarEstadoUsuario(usuario)}
                                                        >
                                                            {usuario.esActivo ? 'Desactivar' : 'Activar'}
                                                        </Button>
                                                    </Group>
                                                )}
                                            </Table.Td>
                                        </Table.Tr>
                                    ))}
                                </Table.Tbody>
                            </Table>
                        </div>
                    </Card>
                </Tabs.Panel>

                <Tabs.Panel value="roles">
                    <Card withBorder radius="md">
                        <Group justify="space-between" mb="md">
                            <div>
                                <Text fw={700}>Roles y permisos</Text>
                                <Text size="sm" c="dimmed">
                                    Los permisos se guardan en base de datos y pueden crecer con el sistema.
                                </Text>
                            </div>
                            {puedeEditarRoles && (
                                <Button leftSection={<IconPlus size={17} />} onClick={nuevoRol}>
                                    Nuevo rol
                                </Button>
                            )}
                        </Group>

                        <div className="table-wrapper">
                            <Table striped highlightOnHover>
                                <Table.Thead>
                                    <Table.Tr>
                                        <Table.Th>Rol</Table.Th>
                                        <Table.Th>Descripción</Table.Th>
                                        <Table.Th>Permisos</Table.Th>
                                        <Table.Th>Estado</Table.Th>
                                        <Table.Th>Acciones</Table.Th>
                                    </Table.Tr>
                                </Table.Thead>
                                <Table.Tbody>
                                    {roles.map((rol) => (
                                        <Table.Tr key={rol.id}>
                                            <Table.Td><Text fw={600}>{rol.nombre}</Text></Table.Td>
                                            <Table.Td>{rol.descripcion || '-'}</Table.Td>
                                            <Table.Td>{rol.permisos.length}</Table.Td>
                                            <Table.Td>
                                                <Badge color={rol.esActivo ? 'green' : 'gray'}>
                                                    {rol.esActivo ? 'Activo' : 'Inactivo'}
                                                </Badge>
                                            </Table.Td>
                                            <Table.Td>
                                                {puedeEditarRoles && (
                                                    <Group gap="xs" wrap="nowrap">
                                                        <Button
                                                            size="xs"
                                                            variant="light"
                                                            leftSection={<IconEdit size={15} />}
                                                            onClick={() => editarRol(rol)}
                                                        >
                                                            Editar
                                                        </Button>
                                                        <Button
                                                            size="xs"
                                                            variant="subtle"
                                                            color={rol.esActivo ? 'red' : 'green'}
                                                            disabled={rol.nombre === 'Administrador' && rol.esActivo}
                                                            onClick={() => cambiarEstadoRol(rol)}
                                                        >
                                                            {rol.esActivo ? 'Desactivar' : 'Activar'}
                                                        </Button>
                                                    </Group>
                                                )}
                                            </Table.Td>
                                        </Table.Tr>
                                    ))}
                                </Table.Tbody>
                            </Table>
                        </div>
                    </Card>
                </Tabs.Panel>
            </Tabs>

            <Modal
                opened={usuarioOpened}
                onClose={closeUsuario}
                title={usuarioEditandoId ? 'Editar usuario' : 'Nuevo usuario'}
                size="lg"
            >
                <Stack>
                    <SimpleGrid cols={{ base: 1, sm: 2 }}>
                        <TextInput
                            label="Nombre"
                            required
                            value={usuarioForm.nombre}
                            onChange={(event) => setUsuarioForm({
                                ...usuarioForm,
                                nombre: event.currentTarget.value,
                            })}
                        />
                        <TextInput
                            label="Apellido"
                            required
                            value={usuarioForm.apellido}
                            onChange={(event) => setUsuarioForm({
                                ...usuarioForm,
                                apellido: event.currentTarget.value,
                            })}
                        />
                        <TextInput
                            label="Usuario"
                            required
                            value={usuarioForm.nombreUsuario}
                            onChange={(event) => setUsuarioForm({
                                ...usuarioForm,
                                nombreUsuario: event.currentTarget.value,
                            })}
                        />
                        <TextInput
                            label="Email"
                            type="email"
                            value={usuarioForm.email}
                            onChange={(event) => setUsuarioForm({
                                ...usuarioForm,
                                email: event.currentTarget.value,
                            })}
                        />
                    </SimpleGrid>

                    <PasswordInput
                        label={usuarioEditandoId ? 'Nueva contraseña' : 'Contraseña'}
                        description={usuarioEditandoId
                            ? 'Déjala vacía para conservar la contraseña actual.'
                            : 'Si la dejas vacía se asignará la contraseña temporal configurada en el backend.'}
                        leftSection={<IconKey size={16} />}
                        value={usuarioForm.password}
                        onChange={(event) => setUsuarioForm({
                            ...usuarioForm,
                            password: event.currentTarget.value,
                        })}
                    />

                    <MultiSelect
                        label="Roles"
                        searchable
                        data={roles
                            .filter((rol) => rol.esActivo)
                            .map((rol) => ({
                                value: String(rol.id),
                                label: rol.nombre,
                            }))}
                        value={usuarioForm.roles}
                        onChange={(value) => setUsuarioForm({
                            ...usuarioForm,
                            roles: value,
                        })}
                    />

                    <Group justify="flex-end">
                        <Button variant="default" onClick={closeUsuario}>Cancelar</Button>
                        <Button
                            onClick={guardarUsuario}
                            disabled={
                                !usuarioForm.nombre
                                || !usuarioForm.apellido
                                || !usuarioForm.nombreUsuario
                            }
                        >
                            Guardar usuario
                        </Button>
                    </Group>
                </Stack>
            </Modal>

            <Modal
                opened={rolOpened}
                onClose={closeRol}
                title={rolEditandoId ? 'Editar rol' : 'Nuevo rol'}
                size="lg"
            >
                <Stack>
                    <TextInput
                        label="Nombre del rol"
                        required
                        value={rolForm.nombre}
                        onChange={(event) => setRolForm({
                            ...rolForm,
                            nombre: event.currentTarget.value,
                        })}
                    />

                    <Textarea
                        label="Descripción"
                        autosize
                        minRows={2}
                        value={rolForm.descripcion}
                        onChange={(event) => setRolForm({
                            ...rolForm,
                            descripcion: event.currentTarget.value,
                        })}
                    />

                    <MultiSelect
                        label="Permisos"
                        description="Selecciona únicamente las pantallas y acciones que este rol podrá usar."
                        searchable
                        data={opcionesPermisos}
                        value={rolForm.permisos}
                        onChange={(value) => setRolForm({
                            ...rolForm,
                            permisos: value,
                        })}
                    />

                    <Group justify="flex-end">
                        <Button variant="default" onClick={closeRol}>Cancelar</Button>
                        <Button onClick={guardarRol} disabled={!rolForm.nombre}>
                            Guardar rol
                        </Button>
                    </Group>
                </Stack>
            </Modal>
        </>
    );
}
