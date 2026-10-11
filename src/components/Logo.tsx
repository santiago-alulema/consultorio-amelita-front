import { Avatar, Group, Stack, Text } from '@mantine/core';

export default function Logo() {
    return (
        <Group gap="sm" wrap="nowrap">
            <Avatar
                src="/logo-consultorio-amelita.png"
                alt="Consultorio Amelita"
                radius="xl"
                size={46}
            />

            <Stack gap={0} visibleFrom="xs">
                <Text fw={800} lh={1.1} c="blue.9">
                    Consultorio Amelita
                </Text>
                <Text size="xs" c="dimmed">
                    Consultorio médico & farmacia
                </Text>
            </Stack>
        </Group>
    );
}
