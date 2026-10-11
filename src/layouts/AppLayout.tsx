import {
    AppShell,
    Burger,
    Divider,
    Group,
    NavLink,
    ScrollArea,
    Stack,
    Text,
    UnstyledButton,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import {
    IconCalendarEvent,
    IconCashRegister,
    IconChartBar,
    IconFileInvoice,
    IconHeartbeat,
    IconHome,
    IconLogout,
    IconNotes,
    IconPackages,
    IconPill,
    IconShoppingCart,
    IconStethoscope,
    IconTruckDelivery,
    IconUserShield,
    IconUsers,
} from '@tabler/icons-react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import Logo from '../components/Logo';
import { logout, tienePermiso, usuarioActual } from '../services/authService';

const items = [
    ['/', 'Dashboard', IconHome, 'DASHBOARD_VER'],
    ['/agenda', 'Agenda', IconCalendarEvent, 'AGENDA_VER'],
    ['/pacientes', 'Pacientes', IconUsers, 'PACIENTES_VER'],
    ['/historias', 'Historia clínica', IconHeartbeat, 'HISTORIA_VER'],
    ['/consultas', 'Consultas', IconStethoscope, 'CONSULTAS_VER'],
    ['/recetas', 'Recetas', IconNotes, 'RECETAS_VER'],
    ['/productos', 'Productos', IconPill, 'PRODUCTOS_VER'],
    ['/inventario', 'Inventario', IconPackages, 'INVENTARIO_VER'],
    ['/ventas', 'Ventas', IconShoppingCart, 'VENTAS_VER'],
    ['/pedidos', 'Pedidos', IconTruckDelivery, 'PEDIDOS_VER'],
    ['/sri', 'XML / RIDE SRI', IconFileInvoice, 'SRI_VER'],
    ['/caja', 'Cierre de caja', IconCashRegister, 'CAJA_VER'],
    ['/reportes', 'Reportes', IconChartBar, 'REPORTES_VER'],
    ['/usuarios', 'Usuarios y roles', IconUserShield, 'USUARIOS_VER'],
] as const;

export default function AppLayout() {
    const [opened, { toggle, close }] = useDisclosure();
    const navigate = useNavigate();
    const location = useLocation();
    const user = usuarioActual();

    return (
        <AppShell
            header={{ height: 68 }}
            navbar={{
                width: 270,
                breakpoint: 'sm',
                collapsed: { mobile: !opened },
            }}
            padding={{ base: 'sm', sm: 'md', lg: 'lg' }}
        >
            <AppShell.Header px={{ base: 'sm', sm: 'md' }}>
                <Group h="100%" justify="space-between" wrap="nowrap">
                    <Group wrap="nowrap">
                        <Burger
                            opened={opened}
                            onClick={toggle}
                            hiddenFrom="sm"
                            size="sm"
                        />
                        <Logo />
                    </Group>

                    <Stack gap={0} align="flex-end">
                        <Text size="sm" fw={600} lineClamp={1}>
                            {user?.nombre}
                        </Text>
                        <Text size="xs" c="dimmed" visibleFrom="xs">
                            {user?.roles?.join(', ')}
                        </Text>
                    </Stack>
                </Group>
            </AppShell.Header>

            <AppShell.Navbar p="sm">
                <AppShell.Section grow component={ScrollArea} scrollbarSize={6}>
                    <Text size="xs" c="dimmed" fw={700} px="sm" mb="xs">
                        MENÚ PRINCIPAL
                    </Text>

                    {items
                        .filter((item) => tienePermiso(item[3]))
                        .map(([path, label, Icon]) => (
                            <NavLink
                                key={path}
                                active={
                                    path === '/'
                                        ? location.pathname === '/'
                                        : location.pathname.startsWith(path)
                                }
                                label={label}
                                leftSection={<Icon size={18} />}
                                onClick={() => {
                                    navigate(path);
                                    close();
                                }}
                                mb={2}
                            />
                        ))}
                </AppShell.Section>

                <AppShell.Section>
                    <Divider my="sm" />
                    <UnstyledButton className="logout-button" onClick={logout}>
                        <Group p="sm">
                            <IconLogout size={18} />
                            <Text size="sm">Cerrar sesión</Text>
                        </Group>
                    </UnstyledButton>
                </AppShell.Section>
            </AppShell.Navbar>

            <AppShell.Main>
                <div className="page-container">
                    <Outlet />
                </div>
            </AppShell.Main>
        </AppShell>
    );
}
