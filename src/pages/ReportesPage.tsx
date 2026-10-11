import { Button, Card, Group, SimpleGrid, Table, Text, TextInput, Title } from '@mantine/core';
import { IconSearch } from '@tabler/icons-react';
import { useEffect, useState } from 'react';
import { api } from '../api/api';

const hoy = new Date().toISOString().slice(0, 10);

export default function ReportesPage() {
    const [desde, setDesde] = useState(hoy);
    const [hasta, setHasta] = useState(hoy);
    const [ventas, setVentas] = useState<any[]>([]);
    const [consultas, setConsultas] = useState<any[]>([]);

    async function load() {
        const [ventasResponse, consultasResponse] = await Promise.all([
            api.get('/reportes/ventas-diarias', { params: { desde, hasta } }),
            api.get('/reportes/consultas-diarias', { params: { desde, hasta } }),
        ]);

        setVentas(ventasResponse.data);
        setConsultas(consultasResponse.data);
    }

    useEffect(() => {
        load();
    }, []);

    return (
        <>
            <div className="page-header">
                <div>
                    <Title order={2}>Reportes diarios</Title>
                    <Text className="page-subtitle">
                        Revisa la actividad de farmacia y consultas por rango de fechas.
                    </Text>
                </div>
            </div>

            <Card withBorder radius="md" mb="lg">
                <Group align="flex-end">
                    <TextInput
                        type="date"
                        label="Desde"
                        value={desde}
                        onChange={(event) => setDesde(event.currentTarget.value)}
                    />
                    <TextInput
                        type="date"
                        label="Hasta"
                        value={hasta}
                        onChange={(event) => setHasta(event.currentTarget.value)}
                    />
                    <Button leftSection={<IconSearch size={16} />} onClick={load}>
                        Consultar
                    </Button>
                </Group>
            </Card>

            <SimpleGrid cols={{ base: 1, md: 2 }}>
                <Card withBorder radius="md">
                    <Title order={4} mb="sm">Ventas diarias</Title>
                    <div className="table-wrapper">
                        <Table striped>
                            <Table.Thead>
                                <Table.Tr>
                                    <Table.Th>Fecha</Table.Th>
                                    <Table.Th>Ventas</Table.Th>
                                    <Table.Th>Total</Table.Th>
                                </Table.Tr>
                            </Table.Thead>
                            <Table.Tbody>
                                {ventas.map((item) => (
                                    <Table.Tr key={item.fecha}>
                                        <Table.Td>{new Date(item.fecha).toLocaleDateString()}</Table.Td>
                                        <Table.Td>{item.cantidad}</Table.Td>
                                        <Table.Td>${Number(item.total).toFixed(2)}</Table.Td>
                                    </Table.Tr>
                                ))}
                            </Table.Tbody>
                        </Table>
                    </div>
                </Card>

                <Card withBorder radius="md">
                    <Title order={4} mb="sm">Consultas diarias</Title>
                    <div className="table-wrapper">
                        <Table striped>
                            <Table.Thead>
                                <Table.Tr>
                                    <Table.Th>Fecha</Table.Th>
                                    <Table.Th>Consultas</Table.Th>
                                    <Table.Th>Total</Table.Th>
                                </Table.Tr>
                            </Table.Thead>
                            <Table.Tbody>
                                {consultas.map((item) => (
                                    <Table.Tr key={item.fecha}>
                                        <Table.Td>{new Date(item.fecha).toLocaleDateString()}</Table.Td>
                                        <Table.Td>{item.cantidad}</Table.Td>
                                        <Table.Td>${Number(item.total).toFixed(2)}</Table.Td>
                                    </Table.Tr>
                                ))}
                            </Table.Tbody>
                        </Table>
                    </div>
                </Card>
            </SimpleGrid>
        </>
    );
}
