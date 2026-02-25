import { useState, useEffect } from "react";
import { Card, CardBody } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Input, Select } from "~/components/ui/input";
import { Badge } from "~/components/ui/badge";
import { Modal } from "~/components/ui/Modal";
import { ArrowLeft, Plus, Search, Edit, Trash2, Loader2 } from "lucide-react";
import {
    userService,
    type UserResponse,
    type AdminUpdateUserRequest,
} from "~/services/userService";
import { UserRole } from "~/services/authService";
import { toast } from "sonner";

interface UserManagementProps {
    onNavigate: (page: string) => void;
}

export function UserManagement({ onNavigate }: UserManagementProps) {
    const [users, setUsers] = useState<UserResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [roleFilter, setRoleFilter] = useState<string>("all");
    const [createUserModal, setCreateUserModal] = useState(false);
    const [editUserModal, setEditUserModal] = useState<UserResponse | null>(null);
    const [editForm, setEditForm] = useState<AdminUpdateUserRequest>({
        roleName: "STUDENT",
        isActive: true,
    });
    const [deleteUserModal, setDeleteUserModal] = useState<UserResponse | null>(null);

    // New user form
    const [newUser, setNewUser] = useState({
        name: "",
        email: "",
        role: UserRole.STUDENT,
    });

    useEffect(() => {
        async function fetchUsers() {
            try {
                setLoading(true);
                const data = await userService.getUsers();
                setUsers(data);
            } catch (error) {
                console.error("Error fetching users:", error);
            } finally {
                setLoading(false);
            }
        }
        fetchUsers();
    }, []);

    const filteredUsers = users.filter((user) => {
        const matchesSearch =
            user.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.email.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesRole = roleFilter === "all" || user.roleName.toLowerCase() === roleFilter;
        return matchesSearch && matchesRole;
    });

    const handleCreateUser = async () => {
        try {
            await userService.createUser({
                fullName: newUser.name,
                email: newUser.email,
                roleName: newUser.role.toUpperCase() as "STUDENT" | "INSTRUCTOR" | "ADMIN",
            });

            // Refresh user list
            const data = await userService.getUsers();
            setUsers(data);

            toast.success("User created successfully! Credentials sent to email.");
            setCreateUserModal(false);
            setNewUser({ name: "", email: "", role: UserRole.STUDENT });
        } catch (error) {
            console.error("Error creating user:", error);
            toast.error("Failed to create user. Please try again.");
        }
    };

    const openEditModal = (user: UserResponse) => {
        setEditUserModal(user);
        setEditForm({
            roleName: user.roleName as AdminUpdateUserRequest["roleName"],
            isActive: user.isActive,
        });
    };

    const handleUpdateUser = async () => {
        if (!editUserModal) return;
        try {
            await userService.updateUser(editUserModal.userId, editForm);
            const data = await userService.getUsers();
            setUsers(data);
            setEditUserModal(null);
            toast.success("User updated successfully.");
        } catch (error) {
            console.error("Error updating user:", error);
            toast.error("Failed to update user. Please try again.");
        }
    };

    const handleDeleteUser = async () => {
        if (!deleteUserModal) return;
        try {
            await userService.deleteUser(deleteUserModal.userId);
            setUsers(users.filter((u) => u.userId !== deleteUserModal.userId));
        } catch (error) {
            console.error("Error deleting user:", error);
        }
        setDeleteUserModal(null);
    };

    const getRoleBadgeVariant = (roleName: string) => {
        switch (roleName.toUpperCase()) {
            case "ADMIN":
                return "error" as const;
            case "INSTRUCTOR":
                return "warning" as const;
            default:
                return "info" as const;
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-8 h-8 animate-spin text-red-500" />
            </div>
        );
    }

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
                        <h1 className="text-gray-900 dark:text-white mb-2">User Management</h1>
                        <p className="text-gray-600 dark:text-gray-400">
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
                        <p className="text-gray-500 dark:text-gray-400 text-sm">Total Users</p>
                        <h3 className="text-gray-900 dark:text-white text-2xl font-bold mt-1">
                            {users.length}
                        </h3>
                    </CardBody>
                </Card>
                <Card>
                    <CardBody>
                        <p className="text-gray-500 dark:text-gray-400 text-sm">Students</p>
                        <h3 className="text-gray-900 dark:text-white text-2xl font-bold mt-1">
                            {users.filter((u) => u.roleName === "STUDENT").length}
                        </h3>
                    </CardBody>
                </Card>
                <Card>
                    <CardBody>
                        <p className="text-gray-500 dark:text-gray-400 text-sm">Instructors</p>
                        <h3 className="text-gray-900 dark:text-white text-2xl font-bold mt-1">
                            {users.filter((u) => u.roleName === "INSTRUCTOR").length}
                        </h3>
                    </CardBody>
                </Card>
                <Card>
                    <CardBody>
                        <p className="text-gray-500 dark:text-gray-400 text-sm">Active</p>
                        <h3 className="text-gray-900 dark:text-white text-2xl font-bold mt-1">
                            {users.filter((u) => u.isActive).length}
                        </h3>
                    </CardBody>
                </Card>
            </div>

            {/* Filters */}
            <Card>
                <CardBody>
                    <div className="flex gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search by name or email..."
                                className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                            />
                        </div>

                        <select
                            value={roleFilter}
                            onChange={(e) => setRoleFilter(e.target.value)}
                            className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
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
                            <tr className="border-b border-gray-200 dark:border-gray-700">
                                <th className="px-6 py-3 text-left text-xs text-gray-500 dark:text-gray-400 uppercase">
                                    User
                                </th>
                                <th className="px-6 py-3 text-left text-xs text-gray-500 dark:text-gray-400 uppercase">
                                    Role
                                </th>
                                <th className="px-6 py-3 text-left text-xs text-gray-500 dark:text-gray-400 uppercase">
                                    Status
                                </th>
                                <th className="px-6 py-3 text-right text-xs text-gray-500 dark:text-gray-400 uppercase">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredUsers.map((user) => (
                                <tr
                                    key={user.userId}
                                    className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                                >
                                    <td className="px-6 py-4">
                                        <div>
                                            <div className="text-gray-900 dark:text-white">
                                                {user.fullName}
                                            </div>
                                            <div className="text-sm text-gray-500 dark:text-gray-400">
                                                {user.email}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <Badge variant={getRoleBadgeVariant(user.roleName)}>
                                            {user.roleName}
                                        </Badge>
                                    </td>
                                    <td className="px-6 py-4">
                                        {user.isActive ? (
                                            <Badge variant="success">Active</Badge>
                                        ) : (
                                            <Badge variant="error">Disabled</Badge>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center justify-end gap-2">
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => openEditModal(user)}
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
                        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
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
                            { value: UserRole.STUDENT, label: "Student" },
                            { value: UserRole.INSTRUCTOR, label: "Instructor" },
                            { value: UserRole.ADMIN, label: "Admin" },
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
                        <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">User</p>
                            <p className="text-gray-900 dark:text-white font-medium">
                                {editUserModal.fullName}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                {editUserModal.email}
                            </p>
                        </div>
                        <Select
                            label="Role"
                            value={editForm.roleName}
                            onChange={(e) =>
                                setEditForm({
                                    ...editForm,
                                    roleName: e.target.value as AdminUpdateUserRequest["roleName"],
                                })
                            }
                            options={[
                                { value: "STUDENT", label: "Student" },
                                { value: "INSTRUCTOR", label: "Instructor" },
                                { value: "ADMIN", label: "Admin" },
                            ]}
                        />
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-900 dark:text-white">
                                    Account Active
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    Disabled accounts cannot log in
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() =>
                                    setEditForm({ ...editForm, isActive: !editForm.isActive })
                                }
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                    editForm.isActive
                                        ? "bg-green-500"
                                        : "bg-gray-300 dark:bg-gray-600"
                                }`}
                            >
                                <span
                                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                        editForm.isActive ? "translate-x-6" : "translate-x-1"
                                    }`}
                                />
                            </button>
                        </div>
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
                            <Button onClick={handleDeleteUser}>Delete User</Button>
                        </>
                    }
                >
                    <p className="text-gray-900 dark:text-white">
                        Are you sure you want to delete <strong>{deleteUserModal.fullName}</strong>?
                        This action cannot be undone.
                    </p>
                </Modal>
            )}
        </div>
    );
}
