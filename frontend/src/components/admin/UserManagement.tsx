import React, { useState } from "react";
import { Card, CardHeader, CardBody } from "../ui/Card";
import { Button } from "../ui/Button";
import { Input, Select } from "../ui/Input";
import { Badge } from "../ui/Badge";
import { Modal } from "../ui/Modal";
import { ArrowLeft, Plus, Search, Edit, Trash2, UserCheck, UserX } from "lucide-react";
import { mockUsers, type User, type UserRole } from "../../data/mockData";

interface UserManagementProps {
    onNavigate: (page: string) => void;
}

export function UserManagement({ onNavigate }: UserManagementProps) {
    const [users, setUsers] = useState<User[]>(mockUsers);
    const [searchQuery, setSearchQuery] = useState("");
    const [roleFilter, setRoleFilter] = useState<string>("all");
    const [createUserModal, setCreateUserModal] = useState(false);
    const [editUserModal, setEditUserModal] = useState<User | null>(null);
    const [deleteUserModal, setDeleteUserModal] = useState<User | null>(null);

    // New user form
    const [newUser, setNewUser] = useState({
        name: "",
        email: "",
        role: "student" as UserRole,
    });

    const filteredUsers = users.filter((user) => {
        const matchesSearch =
            user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.email.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesRole = roleFilter === "all" || user.role === roleFilter;
        return matchesSearch && matchesRole;
    });

    const handleCreateUser = () => {
        const user: User = {
            id: `u${users.length + 1}`,
            ...newUser,
            enabled: true,
            solvedProblems: 0,
            totalSubmissions: 0,
        };
        setUsers([...users, user]);
        setCreateUserModal(false);
        setNewUser({ name: "", email: "", role: "student" });
    };

    const handleUpdateUser = () => {
        if (!editUserModal) return;
        setUsers(users.map((u) => (u.id === editUserModal.id ? editUserModal : u)));
        setEditUserModal(null);
    };

    const handleDeleteUser = () => {
        if (!deleteUserModal) return;
        setUsers(users.filter((u) => u.id !== deleteUserModal.id));
        setDeleteUserModal(null);
    };

    const toggleUserStatus = (userId: string) => {
        setUsers(users.map((u) => (u.id === userId ? { ...u, enabled: !u.enabled } : u)));
    };

    const getRoleBadgeVariant = (role: UserRole) => {
        switch (role) {
            case "admin":
                return "error" as const;
            case "instructor":
                return "warning" as const;
            default:
                return "info" as const;
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onNavigate("admin-dashboard")}
                    className="mb-4"
                >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Dashboard
                </Button>

                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-[var(--text-primary)] mb-2">User Management</h1>
                        <p className="text-[var(--text-secondary)]">
                            Create, edit, and manage user accounts and permissions.
                        </p>
                    </div>
                    <Button onClick={() => setCreateUserModal(true)}>
                        <Plus className="w-4 h-4 mr-2" />
                        Create User
                    </Button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardBody>
                        <p className="text-[var(--text-tertiary)] text-sm">Total Users</p>
                        <h3 className="text-[var(--text-primary)] mt-1">{users.length}</h3>
                    </CardBody>
                </Card>
                <Card>
                    <CardBody>
                        <p className="text-[var(--text-tertiary)] text-sm">Students</p>
                        <h3 className="text-[var(--text-primary)] mt-1">
                            {users.filter((u) => u.role === "student").length}
                        </h3>
                    </CardBody>
                </Card>
                <Card>
                    <CardBody>
                        <p className="text-[var(--text-tertiary)] text-sm">Instructors</p>
                        <h3 className="text-[var(--text-primary)] mt-1">
                            {users.filter((u) => u.role === "instructor").length}
                        </h3>
                    </CardBody>
                </Card>
                <Card>
                    <CardBody>
                        <p className="text-[var(--text-tertiary)] text-sm">Active</p>
                        <h3 className="text-[var(--text-primary)] mt-1">
                            {users.filter((u) => u.enabled).length}
                        </h3>
                    </CardBody>
                </Card>
            </div>

            {/* Filters */}
            <Card>
                <CardBody>
                    <div className="flex gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-tertiary)]" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search by name or email..."
                                className="w-full pl-10 pr-4 py-2 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary-500)]"
                            />
                        </div>

                        <select
                            value={roleFilter}
                            onChange={(e) => setRoleFilter(e.target.value)}
                            className="px-4 py-2 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary-500)]"
                        >
                            <option value="all">All Roles</option>
                            <option value="student">Students</option>
                            <option value="instructor">Instructors</option>
                            <option value="admin">Admins</option>
                        </select>
                    </div>
                </CardBody>
            </Card>

            {/* Users Table */}
            <Card>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-[var(--border-color)]">
                                <th className="px-6 py-3 text-left text-xs text-[var(--text-tertiary)] uppercase">
                                    User
                                </th>
                                <th className="px-6 py-3 text-left text-xs text-[var(--text-tertiary)] uppercase">
                                    Role
                                </th>
                                <th className="px-6 py-3 text-left text-xs text-[var(--text-tertiary)] uppercase">
                                    Status
                                </th>
                                <th className="px-6 py-3 text-left text-xs text-[var(--text-tertiary)] uppercase">
                                    Stats
                                </th>
                                <th className="px-6 py-3 text-right text-xs text-[var(--text-tertiary)] uppercase">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredUsers.map((user) => (
                                <tr
                                    key={user.id}
                                    className="border-b border-[var(--border-color)] hover:bg-[var(--bg-tertiary)] transition-colors"
                                >
                                    <td className="px-6 py-4">
                                        <div>
                                            <div className="text-[var(--text-primary)]">
                                                {user.name}
                                            </div>
                                            <div className="text-sm text-[var(--text-tertiary)]">
                                                {user.email}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <Badge variant={getRoleBadgeVariant(user.role)}>
                                            {user.role.toUpperCase()}
                                        </Badge>
                                    </td>
                                    <td className="px-6 py-4">
                                        {user.enabled ? (
                                            <Badge variant="success">Active</Badge>
                                        ) : (
                                            <Badge variant="error">Disabled</Badge>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        {user.role === "student" && (
                                            <span className="text-sm text-[var(--text-secondary)]">
                                                {user.solvedProblems} solved |{" "}
                                                {user.totalSubmissions} submissions
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center justify-end gap-2">
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => toggleUserStatus(user.id)}
                                                title={
                                                    user.enabled ? "Disable user" : "Enable user"
                                                }
                                            >
                                                {user.enabled ? (
                                                    <UserX className="w-4 h-4" />
                                                ) : (
                                                    <UserCheck className="w-4 h-4" />
                                                )}
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => setEditUserModal(user)}
                                            >
                                                <Edit className="w-4 h-4" />
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => setDeleteUserModal(user)}
                                            >
                                                <Trash2 className="w-4 h-4 text-red-600" />
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {filteredUsers.length === 0 && (
                        <div className="text-center py-12 text-[var(--text-tertiary)]">
                            No users found
                        </div>
                    )}
                </div>
            </Card>

            {/* Create User Modal */}
            <Modal
                isOpen={createUserModal}
                onClose={() => setCreateUserModal(false)}
                title="Create New User"
                footer={
                    <>
                        <Button variant="outline" onClick={() => setCreateUserModal(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleCreateUser}>Create User</Button>
                    </>
                }
            >
                <div className="space-y-4">
                    <Input
                        label="Full Name"
                        value={newUser.name}
                        onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                        placeholder="John Doe"
                        required
                    />
                    <Input
                        label="Email"
                        type="email"
                        value={newUser.email}
                        onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                        placeholder="john.doe@example.com"
                        required
                    />
                    <Select
                        label="Role"
                        value={newUser.role}
                        onChange={(e) =>
                            setNewUser({ ...newUser, role: e.target.value as UserRole })
                        }
                        options={[
                            { value: "student", label: "Student" },
                            { value: "instructor", label: "Instructor" },
                            { value: "admin", label: "Admin" },
                        ]}
                    />
                </div>
            </Modal>

            {/* Edit User Modal */}
            {editUserModal && (
                <Modal
                    isOpen={true}
                    onClose={() => setEditUserModal(null)}
                    title="Edit User"
                    footer={
                        <>
                            <Button variant="outline" onClick={() => setEditUserModal(null)}>
                                Cancel
                            </Button>
                            <Button onClick={handleUpdateUser}>Save Changes</Button>
                        </>
                    }
                >
                    <div className="space-y-4">
                        <Input
                            label="Full Name"
                            value={editUserModal.name}
                            onChange={(e) =>
                                setEditUserModal({ ...editUserModal, name: e.target.value })
                            }
                        />
                        <Input
                            label="Email"
                            type="email"
                            value={editUserModal.email}
                            onChange={(e) =>
                                setEditUserModal({ ...editUserModal, email: e.target.value })
                            }
                        />
                        <Select
                            label="Role"
                            value={editUserModal.role}
                            onChange={(e) =>
                                setEditUserModal({
                                    ...editUserModal,
                                    role: e.target.value as UserRole,
                                })
                            }
                            options={[
                                { value: "student", label: "Student" },
                                { value: "instructor", label: "Instructor" },
                                { value: "admin", label: "Admin" },
                            ]}
                        />
                    </div>
                </Modal>
            )}

            {/* Delete User Modal */}
            {deleteUserModal && (
                <Modal
                    isOpen={true}
                    onClose={() => setDeleteUserModal(null)}
                    title="Delete User"
                    footer={
                        <>
                            <Button variant="outline" onClick={() => setDeleteUserModal(null)}>
                                Cancel
                            </Button>
                            <Button variant="danger" onClick={handleDeleteUser}>
                                Delete User
                            </Button>
                        </>
                    }
                >
                    <p className="text-[var(--text-primary)]">
                        Are you sure you want to delete <strong>{deleteUserModal.name}</strong>?
                        This action cannot be undone.
                    </p>
                </Modal>
            )}
        </div>
    );
}
