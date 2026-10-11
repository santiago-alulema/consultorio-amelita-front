import { Button, Card, Grid, Group, SimpleGrid, Stack, Text, Title } from '@mantine/core';
import {
    IconCalendarEvent,
    IconCashRegister,
    IconHeartbeat,
    IconPackage,
    IconReportMedical,
    IconShoppingCart,
} from '@tabler/icons-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/api';
import { tienePermiso } from '../services/authService';

export default function DashboardPage() {
    const navigate = useNavigate();
    const [data, setData] = useState<any>({});

    useEffect(() => {
        api.get('/reportes/dashboard').then((response) => setData(response.data));
    }, []);

    const cards = [
        {
            label: 'Consultas hoy',
            value: data.consultasHoy ?? 0,
            detail: `$${Number(data.valorConsultasHoy ?? 0).toFixed(2)} en consultas`,
            icon: IconReportMedical,
        },
        {
            label: 'Ventas hoy',
            value: data.ventasHoy ?? 0,
            detail: `$${Number(data.totalVentasHoy ?? 0).toFixed(2)} vendidos`,
            icon: IconShoppingCart,
        },
        {
            label: 'Stock bajo',
            value: data.stockBajo ?? 0,
            detail: `${data.agotados ?? 0} productos agotados`,
            icon: IconPackage,
        },
        {
            label: 'Pedidos pendientes',
            value: data.pedidosPendientes ?? 0,
            detail: 'Pendientes de recepción',
            icon: IconHeartbeat,
        },
    ];

    return (
        <>
            <div className="page-header">
                <div>
                    <Title order={2}>Dashboard</Title>
                    <Text className="page-subtitle">
                        Resumen operativo de Consultorio Amelita.
                    </Text>
                </div>
            </div>

            <SimpleGrid cols={{ base: 1, xs: 2, lg: 4 }}>
                {cards.map(({ label, value, detail, icon: Icon }) => (
                    <Card withBorder radius="md" key={label}>
                        <Group justify="space-between" align="flex-start">
                            <Stack gap={2}>
                                <Text size="sm" c="dimmed">{label}</Text>
                                <Text fw={800} size="xl">{value}</Text>
                                <Text size="xs" c="dimmed">{detail}</Text>
                            </Stack>
                            <Icon size={26} stroke={1.5} />
                        </Group>
                    </Card>
                ))}
            </SimpleGrid>

            <Grid mt="lg">
                <Grid.Col span={{ base: 12, md: 7 }}>
                    <Card withBorder radius="md" h="100%">
                        <Text fw={700} mb="xs">Accesos rápidos</Text>
                        <Text size="sm" c="dimmed" mb="md">
                            Continúa los procesos más frecuentes sin recorrer todo el menú.
                        </Text>

                        <Group>
                            {tienePermiso('AGENDA_VER') && (
                                <Button
                                    variant="light"
                                    leftSection={<IconCalendarEvent size={17} />}
                                    onClick={() => navigate('/agenda')}
                                >
                                    Ver agenda
                                </Button>
                            )}
                            {tienePermiso('CONSULTAS_CREAR') && (
                                <Button
                                    variant="light"
                                    leftSection={<IconReportMedical size={17} />}
                                    onClick={() => navigate('/consultas')}
                                >
                                    Registrar consulta
                                </Button>
                            )}
                            {tienePermiso('CAJA_VER') && (
                                <Button
                                    variant="light"
                                    leftSection={<IconCashRegister size={17} />}
                                    onClick={() => navigate('/caja')}
                                >
                                    Ir a caja
                                </Button>
                            )}
                        </Group>
                    </Card>
                </Grid.Col>

                <Grid.Col span={{ base: 12, md: 5 }}>
                    <Card withBorder radius="md" h="100%">
                        <Text fw={700} mb="xs">Atención de inventario</Text>
                        <Text size="sm" c="dimmed">
                            {data.stockBajo ?? 0} productos están en stock bajo y {data.agotados ?? 0} se encuentran agotados.
                        </Text>
                        <Button
                            mt="md"
                            variant="default"
                            onClick={() => navigate('/productos')}
                        >
                            Revisar productos
                        </Button>
                    </Card>
                </Grid.Col>
            </Grid>
        </>
    );
}
