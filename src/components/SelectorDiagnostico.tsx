import { Alert, Button, Select, SimpleGrid, Stack } from '@mantine/core';
import { useEffect, useState } from 'react';
import { api } from '../api/api';

type Opcion = { codigo: string; nombre: string };

export default function SelectorDiagnostico({
    value,
    onChange,
}: {
    value: string;
    onChange: (diagnostico: string) => void;
}) {
    const [categorias, setCategorias] = useState<Opcion[]>([]);
    const [enfermedades, setEnfermedades] = useState<Opcion[]>([]);
    const [categoria, setCategoria] = useState<string | null>(null);
    const [enfermedad, setEnfermedad] = useState<string | null>(null);
    const [cargando, setCargando] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        let vigente = true;
        api.get('/enfermedades/categorias').then((response) => {
            if (vigente) setCategorias(response.data);
        }).catch(() => {
            if (vigente) setError('No se pudo cargar el catálogo CIE-10. Puedes escribir el diagnóstico manualmente.');
        });
        return () => { vigente = false; };
    }, []);

    useEffect(() => {
        let vigente = true;
        setEnfermedades([]);
        setEnfermedad(null);
        if (!categoria) {
            setCargando(false);
            return;
        }
        setCargando(true);
        setError('');
        api.get('/enfermedades', { params: { categoria } }).then((response) => {
            if (vigente) setEnfermedades(response.data);
        }).catch(() => {
            if (vigente) setError('No se pudieron cargar las enfermedades. Puedes escribir el diagnóstico manualmente.');
        }).finally(() => {
            if (vigente) setCargando(false);
        });
        return () => { vigente = false; };
    }, [categoria]);

    function agregar() {
        const seleccionada = enfermedades.find((item) => item.codigo === enfermedad);
        if (!seleccionada) return;
        const linea = `${seleccionada.nombre} (${seleccionada.codigo})`;
        if (!value.split('\n').some((item) => item.trim() === linea)) {
            onChange([value.trimEnd(), linea].filter(Boolean).join('\n'));
        }
        setEnfermedad(null);
    }

    return (
        <Stack gap="xs">
            {error && <Alert color="yellow">{error}</Alert>}
            <SimpleGrid cols={{ base: 1, sm: 2 }}>
                <Select
                    label="Categoría CIE-10"
                    placeholder="Buscar categoría por código o nombre"
                    limit={50}
                    searchable
                    clearable
                    value={categoria}
                    onChange={(codigo) => {
                        setCategoria(codigo);
                        setEnfermedad(null);
                        setEnfermedades([]);
                    }}
                    data={categorias.map((item) => ({ value: item.codigo, label: `${item.codigo} · ${item.nombre}` }))}
                    nothingFoundMessage="No hay categorías disponibles"
                />
                <Select
                    label="Enfermedad"
                    placeholder={cargando ? 'Cargando enfermedades…' : 'Seleccionar enfermedad'}
                    searchable
                    clearable
                    disabled={!categoria || cargando}
                    value={enfermedad}
                    onChange={setEnfermedad}
                    data={enfermedades.map((item) => ({ value: item.codigo, label: `${item.codigo} · ${item.nombre}` }))}
                    nothingFoundMessage="No se encontraron enfermedades"
                />
            </SimpleGrid>
            <Button variant="light" onClick={agregar} disabled={!enfermedad || cargando} style={{ alignSelf: 'flex-start' }}>
                Agregar al diagnóstico
            </Button>
        </Stack>
    );
}
