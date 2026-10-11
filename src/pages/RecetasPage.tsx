import {
    ActionIcon,
    Button,
    Divider,
    FileButton,
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
    IconDownload,
    IconEye,
    IconFileTypePdf,
    IconPlus,
    IconPrinter,
    IconSettings,
    IconTrash,
    IconUpload,
} from '@tabler/icons-react';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../api/api';

const nuevoDetalle = () => ({
    productoId: null,
    medicamento: '',
    presentacion: '',
    dosis: '',
    frecuencia: '',
    duracion: '',
    cantidad: 1,
    indicaciones: '',
});

const recetaVacia = () => ({
    pacienteId: '',
    consultaId: null,
    indicacionesGenerales: '',
    detalles: [nuevoDetalle()],
});

const configuracionVacia = {
    nombreClinica: 'Consultorio Amelita',
    subtitulo: 'Medicina general',
    ruc: '',
    direccion: '',
    telefono: '',
    piePagina: 'RECETARIO',
    plantillaArchivo: null,
};

function descargarBlob(blob: Blob, nombreArchivo: string) {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = url;
    link.download = nombreArchivo;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
}

function CampoDetalle({ label, value }: { label: string; value: unknown }) {
    return (
        <div>
            <Text size="sm" c="dimmed">
                {label}
            </Text>
            <Text fw={500}>{value == null || value === '' ? '-' : String(value)}</Text>
        </div>
    );
}

export default function RecetasPage() {
    const [searchParams, setSearchParams] = useSearchParams();
    const [data, setData] = useState<any[]>([]);
    const [pacientes, setPacientes] = useState<any[]>([]);
    const [productos, setProductos] = useState<any[]>([]);
    const [form, setForm] = useState<any>(recetaVacia());
    const [recetaSeleccionada, setRecetaSeleccionada] = useState<any>(null);
    const [recetaGuardadaId, setRecetaGuardadaId] = useState<number | null>(null);
    const [configuracion, setConfiguracion] = useState<any>(configuracionVacia);
    const [plantilla, setPlantilla] = useState<File | null>(null);

    const [opened, { open, close }] = useDisclosure();
    const [detalleOpened, { open: openDetalle, close: closeDetalle }] = useDisclosure();
    const [imprimirOpened, { open: openImprimir, close: closeImprimir }] = useDisclosure();
    const [configOpened, { open: openConfig, close: closeConfig }] = useDisclosure();

    const load = async () => {
        const response = await api.get('/recetas');
        setData(response.data);
    };

    const loadConfiguracion = async () => {
        const response = await api.get('/configuracion-receta');
        setConfiguracion(response.data);
    };

    useEffect(() => {
        Promise.all([
            api.get('/recetas'),
            api.get('/pacientes'),
            api.get('/productos'),
        ]).then(([recetasResponse, pacientesResponse, productosResponse]) => {
            setData(recetasResponse.data);
            setPacientes(pacientesResponse.data);
            setProductos(productosResponse.data);
        });
    }, []);

    useEffect(() => {
        if (searchParams.get('nueva') !== '1') {
            return;
        }

        setForm({
            ...recetaVacia(),
            pacienteId: searchParams.get('pacienteId') ?? '',
            consultaId: searchParams.get('consultaId'),
        });

        open();
    }, [searchParams]);

    useEffect(() => {
        const recetaId = searchParams.get('ver');

        if (!recetaId) {
            return;
        }

        verReceta(Number(recetaId));
    }, [searchParams]);

    function abrirNuevaReceta() {
        setForm(recetaVacia());
        open();
    }

    function cerrarModal() {
        close();

        if (searchParams.get('nueva')) {
            setSearchParams({}, { replace: true });
        }
    }

    function actualizarDetalle(index: number, campo: string, value: any) {
        const detalles = [...form.detalles];
        detalles[index] = { ...detalles[index], [campo]: value };

        if (campo === 'productoId') {
            const producto = productos.find((item) => item.id === Number(value));

            if (producto) {
                detalles[index].medicamento = producto.nombre;
                detalles[index].presentacion = [
                    producto.concentracion,
                    producto.presentacion,
                ]
                    .filter(Boolean)
                    .join(' ');
            }
        }

        setForm({ ...form, detalles });
    }

    function eliminarDetalle(index: number) {
        if (form.detalles.length === 1) {
            return;
        }

        setForm({
            ...form,
            detalles: form.detalles.filter(
                (_: any, itemIndex: number) => itemIndex !== index,
            ),
        });
    }

    async function guardarReceta() {
        const response = await api.post('/recetas', {
            ...form,
            pacienteId: Number(form.pacienteId),
            consultaId: form.consultaId ? Number(form.consultaId) : null,
            detalles: form.detalles.map((detalle: any) => ({
                ...detalle,
                productoId: detalle.productoId
                    ? Number(detalle.productoId)
                    : null,
            })),
        });

        const recetaId = Number(response.data.id);

        cerrarModal();
        setForm(recetaVacia());
        setRecetaGuardadaId(recetaId);
        await load();
        openImprimir();
    }

    async function verReceta(id: number) {
        const response = await api.get(`/recetas/${id}`);
        setRecetaSeleccionada(response.data);
        openDetalle();
    }

    async function imprimirReceta(id: number) {
        const response = await api.get(`/recetas/${id}/pdf`, {
            responseType: 'blob',
        });

        descargarBlob(response.data, `receta_${id}.pdf`);
    }

    async function abrirConfiguracion() {
        await loadConfiguracion();
        setPlantilla(null);
        openConfig();
    }

    async function guardarConfiguracion() {
        await api.put('/configuracion-receta', {
            nombreClinica: configuracion.nombreClinica,
            subtitulo: configuracion.subtitulo || null,
            ruc: configuracion.ruc || null,
            direccion: configuracion.direccion || null,
            telefono: configuracion.telefono || null,
            piePagina: configuracion.piePagina || null,
            plantillaArchivo: configuracion.plantillaArchivo,
        });

        if (plantilla) {
            const formData = new FormData();
            formData.append('archivo', plantilla);

            await api.post('/configuracion-receta/plantilla', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
        }

        setPlantilla(null);
        closeConfig();
    }

    async function descargarPlantillaActual() {
        const response = await api.get('/configuracion-receta/plantilla', {
            responseType: 'blob',
        });

        const extension = response.data.type === 'image/png' ? 'png' : 'jpg';
        descargarBlob(response.data, `plantilla_receta.${extension}`);
    }

    return (
        <>
            <Group justify="space-between" mb="md">
                <Title order={2}>Recetas</Title>

                <Group>
                    <Button
                        variant="default"
                        leftSection={<IconSettings size={17} />}
                        onClick={abrirConfiguracion}
                    >
                        Configurar plantilla
                    </Button>
                    <Button onClick={abrirNuevaReceta}>Nueva receta</Button>
                </Group>
            </Group>

            <div className="table-wrapper">
                <Table striped withTableBorder highlightOnHover>
                <Table.Thead>
                    <Table.Tr>
                        <Table.Th>Fecha</Table.Th>
                        <Table.Th>Paciente</Table.Th>
                        <Table.Th>Médico</Table.Th>
                        <Table.Th>Medicamentos</Table.Th>
                        <Table.Th>Acciones</Table.Th>
                    </Table.Tr>
                </Table.Thead>

                <Table.Tbody>
                    {data.map((receta) => (
                        <Table.Tr key={receta.id}>
                            <Table.Td>
                                {new Date(receta.fechaEmision).toLocaleString()}
                            </Table.Td>
                            <Table.Td>{receta.paciente}</Table.Td>
                            <Table.Td>{receta.medico}</Table.Td>
                            <Table.Td>
                                {receta.detalles
                                    .map((detalle: any) => detalle.medicamento)
                                    .join(', ')}
                            </Table.Td>
                            <Table.Td>
                                <Group gap="xs">
                                    <Button
                                        size="xs"
                                        variant="default"
                                        leftSection={<IconEye size={16} />}
                                        onClick={() => verReceta(receta.id)}
                                    >
                                        Ver
                                    </Button>
                                    <Button
                                        size="xs"
                                        variant="light"
                                        leftSection={<IconPrinter size={16} />}
                                        onClick={() => imprimirReceta(receta.id)}
                                    >
                                        Imprimir
                                    </Button>
                                </Group>
                            </Table.Td>
                        </Table.Tr>
                    ))}
                </Table.Tbody>
            </Table>
            </div>

            <Modal opened={opened} onClose={cerrarModal} title="Emitir receta" size="xl">
                <Select
                    searchable
                    label="Paciente"
                    data={pacientes.map((paciente) => ({
                        value: String(paciente.id),
                        label: `${paciente.identificacion} - ${paciente.nombres} ${paciente.apellidos}`,
                    }))}
                    value={form.pacienteId}
                    onChange={(value) =>
                        setForm({ ...form, pacienteId: value ?? '' })
                    }
                />

                <Textarea
                    mt="sm"
                    label="Indicaciones generales"
                    value={form.indicacionesGenerales}
                    onChange={(event) =>
                        setForm({
                            ...form,
                            indicacionesGenerales: event.currentTarget.value,
                        })
                    }
                />

                {form.detalles.map((detalle: any, index: number) => (
                    <SimpleGrid
                        key={index}
                        cols={{ base: 1, sm: 4 }}
                        mt="md"
                        p="md"
                        style={{
                            border: '1px solid var(--mantine-color-gray-3)',
                            borderRadius: 8,
                        }}
                    >
                        <Select
                            searchable
                            clearable
                            label="Producto"
                            data={productos.map((producto) => ({
                                value: String(producto.id),
                                label: producto.nombre,
                            }))}
                            value={
                                detalle.productoId
                                    ? String(detalle.productoId)
                                    : null
                            }
                            onChange={(value) =>
                                actualizarDetalle(index, 'productoId', value)
                            }
                        />

                        <TextInput
                            label="Medicamento"
                            value={detalle.medicamento}
                            onChange={(event) =>
                                actualizarDetalle(
                                    index,
                                    'medicamento',
                                    event.currentTarget.value,
                                )
                            }
                        />

                        <TextInput
                            label="Presentación"
                            value={detalle.presentacion}
                            onChange={(event) =>
                                actualizarDetalle(
                                    index,
                                    'presentacion',
                                    event.currentTarget.value,
                                )
                            }
                        />

                        <TextInput
                            label="Dosis"
                            value={detalle.dosis}
                            onChange={(event) =>
                                actualizarDetalle(
                                    index,
                                    'dosis',
                                    event.currentTarget.value,
                                )
                            }
                        />

                        <TextInput
                            label="Frecuencia"
                            value={detalle.frecuencia}
                            onChange={(event) =>
                                actualizarDetalle(
                                    index,
                                    'frecuencia',
                                    event.currentTarget.value,
                                )
                            }
                        />

                        <TextInput
                            label="Duración"
                            value={detalle.duracion}
                            onChange={(event) =>
                                actualizarDetalle(
                                    index,
                                    'duracion',
                                    event.currentTarget.value,
                                )
                            }
                        />

                        <NumberInput
                            label="Cantidad"
                            min={0}
                            value={detalle.cantidad}
                            onChange={(value) =>
                                actualizarDetalle(index, 'cantidad', value)
                            }
                        />

                        <TextInput
                            label="Indicaciones"
                            value={detalle.indicaciones}
                            onChange={(event) =>
                                actualizarDetalle(
                                    index,
                                    'indicaciones',
                                    event.currentTarget.value,
                                )
                            }
                        />

                        <Group align="flex-end">
                            <ActionIcon
                                color="red"
                                variant="light"
                                disabled={form.detalles.length === 1}
                                onClick={() => eliminarDetalle(index)}
                            >
                                <IconTrash size={16} />
                            </ActionIcon>
                        </Group>
                    </SimpleGrid>
                ))}

                <Button
                    variant="light"
                    mt="md"
                    leftSection={<IconPlus size={16} />}
                    onClick={() =>
                        setForm({
                            ...form,
                            detalles: [...form.detalles, nuevoDetalle()],
                        })
                    }
                >
                    Agregar medicamento
                </Button>

                <Group justify="flex-end" mt="md">
                    <Button variant="default" onClick={cerrarModal}>
                        Cancelar
                    </Button>
                    <Button onClick={guardarReceta} disabled={!form.pacienteId}>
                        Guardar receta
                    </Button>
                </Group>
            </Modal>

            <Modal
                opened={detalleOpened}
                onClose={closeDetalle}
                title="Detalle de receta"
                size="lg"
            >
                {recetaSeleccionada && (
                    <Stack gap="md">
                        <SimpleGrid cols={{ base: 1, sm: 2 }}>
                            <CampoDetalle
                                label="Paciente"
                                value={`${recetaSeleccionada.paciente.nombres} ${recetaSeleccionada.paciente.apellidos}`}
                            />
                            <CampoDetalle
                                label="Identificación"
                                value={recetaSeleccionada.paciente.identificacion}
                            />
                            <CampoDetalle
                                label="Médico"
                                value={`${recetaSeleccionada.medico.nombre} ${recetaSeleccionada.medico.apellido}`}
                            />
                            <CampoDetalle
                                label="Fecha"
                                value={new Date(
                                    recetaSeleccionada.fechaEmision,
                                ).toLocaleString()}
                            />
                        </SimpleGrid>

                        <Divider />

                        {recetaSeleccionada.detalles.map((detalle: any) => (
                            <Stack
                                key={detalle.id}
                                gap={4}
                                p="sm"
                                style={{
                                    border: '1px solid var(--mantine-color-gray-3)',
                                    borderRadius: 8,
                                }}
                            >
                                <Text fw={700}>{detalle.medicamento}</Text>
                                <Text size="sm">
                                    {detalle.presentacion || 'Sin presentación'}
                                </Text>
                                <Text size="sm">
                                    {detalle.dosis} - cada {detalle.frecuencia} - durante{' '}
                                    {detalle.duracion}
                                </Text>
                                <Text size="sm">
                                    Cantidad: {detalle.cantidad ?? '-'}
                                </Text>
                                {detalle.indicaciones && (
                                    <Text size="sm">
                                        Indicaciones: {detalle.indicaciones}
                                    </Text>
                                )}
                            </Stack>
                        ))}

                        <CampoDetalle
                            label="Indicaciones generales"
                            value={recetaSeleccionada.indicacionesGenerales}
                        />

                        <Group justify="flex-end">
                            <Button
                                leftSection={<IconPrinter size={16} />}
                                onClick={() => imprimirReceta(recetaSeleccionada.id)}
                            >
                                Imprimir receta
                            </Button>
                        </Group>
                    </Stack>
                )}
            </Modal>

            <Modal
                opened={imprimirOpened}
                onClose={closeImprimir}
                title="Receta guardada"
                centered
            >
                <Text>
                    La receta se guardó correctamente. ¿Deseas descargarla en PDF para
                    imprimirla?
                </Text>

                <Group justify="flex-end" mt="lg">
                    <Button variant="default" onClick={closeImprimir}>
                        Ahora no
                    </Button>
                    <Button
                        leftSection={<IconFileTypePdf size={17} />}
                        onClick={async () => {
                            if (recetaGuardadaId) {
                                await imprimirReceta(recetaGuardadaId);
                            }
                            closeImprimir();
                        }}
                    >
                        Imprimir receta
                    </Button>
                </Group>
            </Modal>

            <Modal
                opened={configOpened}
                onClose={closeConfig}
                title="Plantilla de receta"
                size="lg"
            >
                <Stack>
                    <TextInput
                        label="Nombre del consultorio"
                        value={configuracion.nombreClinica ?? ''}
                        onChange={(event) =>
                            setConfiguracion({
                                ...configuracion,
                                nombreClinica: event.currentTarget.value,
                            })
                        }
                    />

                    <TextInput
                        label="Subtítulo"
                        value={configuracion.subtitulo ?? ''}
                        onChange={(event) =>
                            setConfiguracion({
                                ...configuracion,
                                subtitulo: event.currentTarget.value,
                            })
                        }
                    />

                    <SimpleGrid cols={{ base: 1, sm: 2 }}>
                        <TextInput
                            label="RUC"
                            value={configuracion.ruc ?? ''}
                            onChange={(event) =>
                                setConfiguracion({
                                    ...configuracion,
                                    ruc: event.currentTarget.value,
                                })
                            }
                        />

                        <TextInput
                            label="Teléfono"
                            value={configuracion.telefono ?? ''}
                            onChange={(event) =>
                                setConfiguracion({
                                    ...configuracion,
                                    telefono: event.currentTarget.value,
                                })
                            }
                        />
                    </SimpleGrid>

                    <TextInput
                        label="Dirección"
                        value={configuracion.direccion ?? ''}
                        onChange={(event) =>
                            setConfiguracion({
                                ...configuracion,
                                direccion: event.currentTarget.value,
                            })
                        }
                    />

                    <TextInput
                        label="Pie de página"
                        value={configuracion.piePagina ?? ''}
                        onChange={(event) =>
                            setConfiguracion({
                                ...configuracion,
                                piePagina: event.currentTarget.value,
                            })
                        }
                    />

                    <div>
                        <Text size="sm" fw={500} mb={5}>
                            Imagen de plantilla
                        </Text>
                        <Text size="sm" c="dimmed" mb="sm">
                            Puedes subir un PNG o JPG con tu diseño. El PDF se imprime en A4 horizontal con dos recetas y una línea punteada al centro para cortar.
                        </Text>

                        <Group>
                            <FileButton
                                onChange={setPlantilla}
                                accept="image/png,image/jpeg"
                            >
                                {(props) => (
                                    <Button
                                        {...props}
                                        variant="light"
                                        leftSection={<IconUpload size={16} />}
                                    >
                                        Seleccionar plantilla
                                    </Button>
                                )}
                            </FileButton>

                            {configuracion.plantillaArchivo && (
                                <Button
                                    variant="default"
                                    leftSection={<IconDownload size={16} />}
                                    onClick={descargarPlantillaActual}
                                >
                                    Descargar actual
                                </Button>
                            )}
                        </Group>

                        <Text size="sm" mt="xs">
                            {plantilla
                                ? `Nueva plantilla: ${plantilla.name}`
                                : configuracion.plantillaArchivo
                                  ? `Plantilla actual: ${configuracion.plantillaArchivo}`
                                  : 'Actualmente no hay una imagen de plantilla cargada.'}
                        </Text>
                    </div>

                    <Group justify="flex-end" mt="md">
                        <Button variant="default" onClick={closeConfig}>
                            Cancelar
                        </Button>
                        <Button onClick={guardarConfiguracion}>Guardar cambios</Button>
                    </Group>
                </Stack>
            </Modal>
        </>
    );
}
