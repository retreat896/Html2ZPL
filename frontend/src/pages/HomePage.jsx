import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ActionIcon, Anchor, AppShell, Badge, Box, Button, Container, Divider, Group, Menu, Stack, Text, Title, Tooltip, useComputedColorScheme } from '@mantine/core';
import { IconArrowDown, IconArrowUpRight, IconBrandGithub, IconCode, IconDeviceDesktop, IconExternalLink, IconLogin, IconLogout, IconPrinter, IconSettings, IconUserCircle } from '@tabler/icons-react';
import { useAuth } from '../context/AuthContext';
import LoginModal from '../components/common/LoginModal';

const repositoryUrl = 'https://github.com/retreat896/Html2ZPL';

export default function HomePage() {
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
    const colorScheme = useComputedColorScheme('light', { getInitialValueInEffect: true });

    return (
        <AppShell header={{ height: 68 }} padding={0} className="home-shell">
            <AppShell.Header className="home-header">
                <Container size="xl" h="100%">
                    <Group h="100%" justify="space-between" wrap="nowrap">
                        <Anchor component="button" type="button" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} underline="never" c="dark">
                            <Group gap="sm" wrap="nowrap">
                                <img src="/favicon.svg" alt="" width="32" height="32" />
                                <Text fw={750} size="lg" className="brand-wordmark">HTML2ZPL</Text>
                            </Group>
                        </Anchor>
                        <Stack gap={0} align="flex-end" className="home-account-stack">
                            <Menu position="bottom-end" withinPortal>
                                <Menu.Target>
                                    <Button variant="default" size="sm" leftSection={<IconUserCircle size={17} />} className="home-account">
                                        {user?.username || 'Guest'}
                                    </Button>
                                </Menu.Target>
                                <Menu.Dropdown>
                                    {user ? (
                                        <Menu.Item leftSection={<IconLogout size={15} />} color="red" onClick={logout}>Sign out</Menu.Item>
                                    ) : (
                                        <Menu.Item leftSection={<IconLogin size={15} />} onClick={() => setIsLoginModalOpen(true)}>Sign in</Menu.Item>
                                    )}
                                </Menu.Dropdown>
                            </Menu>
                            <Menu position="bottom-end" withinPortal>
                                <Menu.Target>
                                    <Button variant="subtle" size="xs" leftSection={<IconSettings size={15} />} aria-label="Open page settings">
                                        Page settings
                                    </Button>
                                </Menu.Target>
                                <Menu.Dropdown>
                                    <Menu.Label>Page sections</Menu.Label>
                                    <Menu.Item component="a" href="#why" leftSection={<IconArrowDown size={15} />}>Why I made it</Menu.Item>
                                    <Menu.Item component="a" href="#self-host" leftSection={<IconCode size={15} />}>Self-hosting</Menu.Item>
                                    <Menu.Divider />
                                    <Menu.Label>Project</Menu.Label>
                                    <Menu.Item component="a" href={repositoryUrl} target="_blank" rel="noreferrer" leftSection={<IconBrandGithub size={15} />}>GitHub repository</Menu.Item>
                                    <Menu.Item component="a" href={`${repositoryUrl}/issues`} target="_blank" rel="noreferrer" leftSection={<IconArrowUpRight size={15} />}>Report an issue</Menu.Item>
                                    <Menu.Divider />
                                    <Menu.Item leftSection={<IconDeviceDesktop size={15} />} closeMenuOnClick={false}>
                                        Device theme: {colorScheme === 'dark' ? 'Dark' : 'Light'}
                                    </Menu.Item>
                                </Menu.Dropdown>
                            </Menu>
                        </Stack>
                    </Group>
                </Container>
            </AppShell.Header>

            <AppShell.Main className="home-main">
                <section className="home-hero">
                    <Container size="xl" className="home-hero-inner">
                        <Group justify="space-between" align="end" gap="xl" className="home-hero-copy">
                            <Box maw={760}>
                                <Badge variant="light" color="brand" mb="md">OPEN-SOURCE ZPL DESIGNER</Badge>
                                <Title order={1} className="home-title">HTML2ZPL</Title>
                                <Text className="home-tagline">Design a label visually. Leave with ZPL.</Text>
                                <Text size="lg" c="dimmed" maw={640} mt="md">
                                    A browser-based workspace for creating, previewing, and exporting labels for Zebra printers.
                                </Text>
                                <Group mt="xl" gap="sm">
                                    <Button color="brand" variant="filled" size="md" style={{ backgroundColor: 'rgb(var(--theme-brand-6))', color: 'rgb(var(--theme-neutral-0))' }} onClick={() => navigate('/editor/new')} rightSection={<IconArrowUpRight size={17} />}>
                                        Open the editor
                                    </Button>
                                    <Button component="a" href={`${repositoryUrl}/tree/main/frontend/src`} target="_blank" rel="noreferrer" variant="default" size="md" rightSection={<IconBrandGithub size={17} />}>
                                        Explore the source
                                    </Button>
                                </Group>
                            </Box>
                            <Anchor href="#why" className="home-scroll-cue" aria-label="Scroll to learn about the project">
                                <IconArrowDown size={18} />
                                <span>About the project</span>
                            </Anchor>
                        </Group>

                        <figure className="home-product-figure">
                            <img src="/HomePagePreview.png" alt="Imported ZPL shipping label open in the HTML2ZPL editor" />
                            <figcaption>Design on a canvas, inspect the printer preview, and adjust label properties in one workspace.</figcaption>
                        </figure>
                    </Container>
                </section>

                <section id="why" className="home-story">
                    <Container size="xl" py={{ base: 52, md: 84 }}>
                        <div className="home-story-grid">
                            <Box>
                                <Badge variant="outline" color="brand" mb="md">THE REASON</Badge>
                                <Title order={2} className="home-section-title">Why I made it</Title>
                            </Box>
                            <Stack gap="md" maw={700}>
                                <Text size="lg" className="home-story-lead">
                                    I wanted label design to feel less like writing printer commands by hand and more like arranging the label you actually want to print.
                                </Text>
                                <Text c="dimmed">
                                    HTML2ZPL brings the canvas, label settings, object properties, and ZPL preview together. Place text, shapes, lines, barcodes, and images, then inspect and export the generated ZPL.
                                </Text>
                                <Group gap="xl" className="home-capabilities">
                                    <Group gap="xs" wrap="nowrap"><IconCode size={18} /><Text size="sm">Visual editing</Text></Group>
                                    <Group gap="xs" wrap="nowrap"><IconPrinter size={18} /><Text size="sm">Printer-aware preview</Text></Group>
                                    <Group gap="xs" wrap="nowrap"><IconExternalLink size={17} /><Text size="sm">ZPL export</Text></Group>
                                </Group>
                            </Stack>
                        </div>
                    </Container>
                </section>

                <section id="self-host" className="home-self-host">
                    <Container size="xl" py={{ base: 52, md: 80 }}>
                        <div className="home-host-grid">
                            <Box>
                                <Badge variant="light" color="lime" mb="md">YOUR MACHINE, YOUR LABELS</Badge>
                                <Title order={2} className="home-host-title">Run it yourself.</Title>
                                <Text c="gray.3" mt="md" maw={510}>
                                    The repository includes the React editor and a local Node API backed by SQLite. Start both locally, or use the source as a starting point for your own deployment.
                                </Text>
                                <Text size="sm" c="gray.4" mt="md">
                                    Requires Node.js 22 or 24. Copy <code>backend/example.env</code> to <code>backend/.env</code> and replace the example secret before using the local API.
                                </Text>
                                <Group mt="xl" gap="lg">
                                    <Anchor href={`${repositoryUrl}#self-hosting`} target="_blank" rel="noreferrer" c="lime.3" fw={600}>Setup guide <IconArrowUpRight size={14} className="inline-icon" /></Anchor>
                                    <Anchor href={`${repositoryUrl}/blob/main/backend/server.js`} target="_blank" rel="noreferrer" c="gray.2">Local API source <IconArrowUpRight size={14} className="inline-icon" /></Anchor>
                                </Group>
                            </Box>
                            <Box>
                                <Text size="xs" fw={700} tt="uppercase" c="gray.4" mb="sm">Start the local app</Text>
                                <Box component="pre" className="home-code"><code>{`git clone ${repositoryUrl}.git
cd Html2ZPL
npm install
npm install --prefix backend
npm install --prefix frontend
npm run dev`}</code></Box>
                                <Text size="xs" c="gray.5" mt="sm">Editor: localhost:5173 · Local API: localhost:3000</Text>
                            </Box>
                        </div>
                    </Container>
                </section>

                <footer className="home-footer">
                    <Container size="xl" py="lg">
                        <Group justify="space-between" gap="md" wrap="wrap">
                            <Text size="sm" c="dimmed">HTML2ZPL is an open-source project in active development.</Text>
                            <Group gap="lg">
                                <Anchor href={repositoryUrl} target="_blank" rel="noreferrer" c="dark">Source code</Anchor>
                                <Anchor href={`${repositoryUrl}/issues`} target="_blank" rel="noreferrer" c="dark">Report an issue</Anchor>
                                <Anchor href={`${repositoryUrl}/blob/main/readme.md`} target="_blank" rel="noreferrer" c="dark">Documentation</Anchor>
                            </Group>
                        </Group>
                    </Container>
                </footer>
            </AppShell.Main>

            <LoginModal isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} />
        </AppShell>
    );
}