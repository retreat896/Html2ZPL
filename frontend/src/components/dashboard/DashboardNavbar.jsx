import React, { useState } from 'react';
import { ActionIcon, Anchor, Button, Container, Group, Menu, Text, Tooltip } from '@mantine/core';
import { IconBrandGithub, IconLogin, IconLogout, IconUserCircle } from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import LoginModal from '../common/LoginModal';

export default function DashboardNavbar() {
    const { user, logout } = useAuth();
    const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
    const navigate = useNavigate();

    return (
        <>
            <header className="dashboard-header">
                <Container size="xl" h={68}>
                    <Group h="100%" justify="space-between" wrap="nowrap">
                        <Anchor component="button" type="button" onClick={() => navigate('/')} underline="never" c="dark">
                            <Group gap="sm" wrap="nowrap">
                                <img src="/favicon.svg" alt="" width="32" height="32" />
                                <Text fw={750} size="lg" className="brand-wordmark">Html2ZPL</Text>
                            </Group>
                        </Anchor>
                        <Group gap="xs" wrap="nowrap">
                            <Button variant="subtle" color="dark" size="sm" onClick={() => navigate('/')}>Workspace</Button>
                            <Tooltip label="View source on GitHub">
                                <ActionIcon component="a" href="https://github.com/retreat896/html2zpl" target="_blank" rel="noreferrer" variant="subtle" color="dark" size="lg" aria-label="GitHub">
                                    <IconBrandGithub size={19} />
                                </ActionIcon>
                            </Tooltip>
                            <Menu position="bottom-end" withinPortal>
                                <Menu.Target>
                                    <Button variant="default" size="sm" leftSection={<IconUserCircle size={17} />}>{user?.username || 'Guest'}</Button>
                                </Menu.Target>
                                <Menu.Dropdown>
                                    {user ? (
                                        <Menu.Item leftSection={<IconLogout size={15} />} color="red" onClick={logout}>Sign out</Menu.Item>
                                    ) : (
                                        <Menu.Item leftSection={<IconLogin size={15} />} onClick={() => setIsLoginModalOpen(true)}>Sign in</Menu.Item>
                                    )}
                                </Menu.Dropdown>
                            </Menu>
                        </Group>
                    </Group>
                </Container>
            </header>
            <LoginModal isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} />
        </>
    );
}
