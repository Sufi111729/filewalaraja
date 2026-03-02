import { createUserLocal, deleteUserLocal, getAllUsers, toPublicUser, updateUserLocal } from "./localUsersStore";

export async function listUsers() {
  return {
    users: getAllUsers().map(toPublicUser)
  };
}

export async function createUser(payload) {
  const user = createUserLocal(payload);
  return {
    message: "User created successfully.",
    user: toPublicUser(user)
  };
}

export async function updateUser(id, payload) {
  const user = updateUserLocal(id, payload);
  return {
    message: "User updated successfully.",
    user: toPublicUser(user)
  };
}

export async function deleteUser(id) {
  deleteUserLocal(id);
  return {
    message: "User deleted successfully."
  };
}
