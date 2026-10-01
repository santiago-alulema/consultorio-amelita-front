import { Box, Center, Loader, Paper, Stack, Text } from '@mantine/core';
import { useEffect, useState } from 'react';
import { subscribeLoading } from '../services/loadingService';

export default function GlobalLoading() {
    const [visible, setVisible] = useState(false);

    useEffect(() => subscribeLoading(setVisible), []);

    if (!visible) {
        return null;
    }

    return (
        <Box
            pos="fixed"
            top={0}
            left={0}
            right={0}
            bottom={0}
            style={{
                zIndex: 9999,
                background: 'rgba(255, 255, 255, 0.72)',
                backdropFilter: 'blur(2px)',
            }}
        >
            <Center h="100%">
                <Paper withBorder shadow="md" radius="md" p="xl">
                    <Stack align="center" gap="sm">
                        <Loader size="lg" />
                        <Text fw={600}>Cargando información...</Text>
                        <Text size="sm" c="dimmed">
                            Por favor, espere un momento.
                        </Text>
                    </Stack>
                </Paper>
            </Center>
        </Box>
    );
}
