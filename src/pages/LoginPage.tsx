import {
    Alert,
    Button,
    Center,
    Image,
    Paper,
    PasswordInput,
    Stack,
    Text,
    TextInput,
    Title,
} from '@mantine/core';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../services/authService';

export default function LoginPage() {
    const navigate = useNavigate();
    const [usuario, setUsuario] = useState('admin');
    const [password, setPassword] = useState('Admin123*');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    async function submit() {
        try {
            setLoading(true);
            setError('');
            await login(usuario, password);
            navigate('/');
        } catch (e: any) {
            setError(e.response?.data ?? 'No se pudo iniciar sesión');
        } finally {
            setLoading(false);
        }
    }

    return (
        <Center mih="100vh" p="md">
            <Paper w={420} maw="100%" p="xl" radius="lg" withBorder shadow="sm">
                <Stack gap="md">
                    <Image
                        src="/logo-consultorio-amelita.png"
                        alt="Consultorio Amelita"
                        w={110}
                        h={110}
                        fit="contain"
                        mx="auto"
                    />

                    <Stack gap={3} align="center">
                        <Title order={2} ta="center" c="blue.9">
                            Consultorio Amelita
                        </Title>
                        <Text c="dimmed" ta="center">
                            Sistema de gestión médica y farmacia
                        </Text>
                    </Stack>

                    {error && <Alert color="red">{error}</Alert>}

                    <TextInput
                        label="Usuario"
                        value={usuario}
                        onChange={(event) => setUsuario(event.currentTarget.value)}
                    />

                    <PasswordInput
                        label="Contraseña"
                        value={password}
                        onChange={(event) => setPassword(event.currentTarget.value)}
                        onKeyDown={(event) => event.key === 'Enter' && submit()}
                    />

                    <Button loading={loading} onClick={submit} size="md">
                        Ingresar
                    </Button>
                </Stack>
            </Paper>
        </Center>
    );
}
