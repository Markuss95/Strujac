import React, { useState, useEffect } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import styled from "styled-components";
import { collection, onSnapshot, doc, updateDoc } from "firebase/firestore";
import { db } from "../../config/firebase";
import { User } from "../../types";
import { useAuth } from "../../contexts/AutContext";
import Modal from "../../components/Modal";

const UsersContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem 1rem;
  min-height: 100vh;
  background-color: #f8f9fa;
`;

const Header = styled.header`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #e0e0e0;
`;

const Title = styled.h1`
  font-size: 1.75rem;
  color: #2c3e50;
  margin: 0;
`;

const BackButton = styled.button`
  padding: 0.5rem 1rem;
  background-color: #0066cc;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
  transition: background-color 0.2s ease;

  &:hover {
    background-color: #0052a3;
  }
`;

const UsersTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
`;

const TableHead = styled.thead`
  background-color: #f8f9fa;
`;

const TableRow = styled.tr`
  &:nth-child(even) {
    background-color: #f8f9fa;
  }
`;

const TableHeader = styled.th`
  padding: 1rem;
  text-align: left;
  font-weight: 600;
  color: #2c3e50;
  border-bottom: 1px solid #e0e0e0;
`;

const TableCell = styled.td`
  padding: 1rem;
  border-bottom: 1px solid #e0e0e0;
  color: #34495e;
`;

const ActionButton = styled.button<{ danger?: boolean }>`
  padding: 0.25rem 0.5rem;
  background-color: ${(props) => (props.danger ? "#e74c3c" : "#27ae60")};
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.875rem;
  transition: background-color 0.2s ease;
  margin-right: 0.5rem;

  &:hover {
    background-color: ${(props) => (props.danger ? "#c0392b" : "#219a52")};
  }

  &:disabled {
    background-color: #ccc;
    cursor: not-allowed;
  }
`;

const EditButton = styled.button`
  padding: 0.25rem 0.5rem;
  background-color: #0066cc;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.875rem;
  transition: background-color 0.2s ease;
  margin-right: 0.5rem;

  &:hover {
    background-color: #0052a3;
  }
`;

const NoUsersMessage = styled.div`
  text-align: center;
  padding: 2rem;
  color: #666;
  font-style: italic;
`;

const EditForm = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1rem;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const Label = styled.label`
  font-weight: 600;
  color: #2c3e50;
`;

const Input = styled.input`
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
`;

const Select = styled.select`
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
`;

const SaveButton = styled.button`
  padding: 0.5rem 1rem;
  background-color: #0066cc;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
  transition: background-color 0.2s ease;

  &:hover {
    background-color: #0052a3;
  }

  &:disabled {
    background-color: #ccc;
    cursor: not-allowed;
  }
`;

const ErrorMessage = styled.div`
  color: #e74c3c;
  font-size: 0.875rem;
`;

const Users: React.FC = () => {
  const { userRole, currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const navigate = useNavigate();
  const [shouldRedirect, setShouldRedirect] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editUsername, setEditUsername] = useState("");
  const [editRole, setEditRole] = useState<"admin" | "regular">("regular");
  const [editError, setEditError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (userRole !== "admin") {
      setShouldRedirect(true);
      return;
    }

    const unsubscribe = onSnapshot(collection(db, "users"), (snapshot) => {
      const userList: User[] = snapshot.docs.map(
        (doc) =>
          ({
            id: doc.id,
            ...doc.data(),
          } as User)
      );
      setUsers(userList);
    });

    return unsubscribe;
  }, [userRole]);

  if (shouldRedirect) {
    return <Navigate to="/" replace />;
  }

  const getRoleDisplay = (role?: "admin" | "regular") => {
    switch (role) {
      case "admin":
        return "Administrator";
      case "regular":
        return "Običan korisnik";
      default:
        return "Običan korisnik";
    }
  };

  const getStatusDisplay = (disabled?: boolean) => {
    return disabled ? "Deaktiviran" : "Aktivan";
  };

  const handleToggleActive = async (user: User) => {
    if (user.id === currentUser?.uid) {
      alert("Ne možete deaktivirati/aktivirati vlastiti račun.");
      return;
    }

    const newDisabled = !user.disabled;
    const action = newDisabled ? "deaktivirati" : "aktivirati";

    if (
      window.confirm(`Jeste li sigurni da želite ${action} ovog korisnika?`)
    ) {
      try {
        const userRef = doc(db, "users", user.id);
        await updateDoc(userRef, {
          disabled: newDisabled,
        });
      } catch (error) {
        console.error("Error updating user status:", error);
        alert("Došlo je do greške prilikom ažuriranja statusa korisnika.");
      }
    }
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setEditUsername(user.username);
    setEditRole(user.role || "regular");
    setEditError(null);
  };

  const handleCloseEdit = () => {
    setEditingUser(null);
    setEditUsername("");
    setEditRole("regular");
    setEditError(null);
    setSaving(false);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    if (!editUsername.trim()) {
      setEditError("Ime i prezime je obavezno.");
      return;
    }

    setSaving(true);
    try {
      const userRef = doc(db, "users", editingUser.id);
      await updateDoc(userRef, {
        username: editUsername.trim(),
        role: editRole,
      });
      handleCloseEdit();
    } catch (error) {
      console.error("Error updating user:", error);
      setEditError("Došlo je do greške prilikom ažuriranja korisnika.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <UsersContainer>
      <Header>
        <Title>Lista Korisnika</Title>
        <BackButton onClick={() => navigate("/")}>Nazad Na Početnu</BackButton>
      </Header>
      {users.length > 0 ? (
        <UsersTable>
          <TableHead>
            <TableRow>
              <TableHeader>Ime i Prezime</TableHeader>
              <TableHeader>Email</TableHeader>
              <TableHeader>Uloga</TableHeader>
              <TableHeader>Status</TableHeader>
              <TableHeader>Akcije</TableHeader>
            </TableRow>
          </TableHead>
          <tbody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>{user.username}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>{getRoleDisplay(user.role)}</TableCell>
                <TableCell>{getStatusDisplay(user.disabled)}</TableCell>
                <TableCell>
                  <EditButton onClick={() => handleEdit(user)}>
                    Uredi
                  </EditButton>
                  <ActionButton
                    danger={user.disabled ? false : true}
                    onClick={() => handleToggleActive(user)}
                    disabled={user.id === currentUser?.uid}
                  >
                    {user.disabled ? "Aktiviraj" : "Deaktiviraj"}
                  </ActionButton>
                </TableCell>
              </TableRow>
            ))}
          </tbody>
        </UsersTable>
      ) : (
        <NoUsersMessage>Nema dostupnih korisnika za prikaz.</NoUsersMessage>
      )}
      {editingUser && (
        <Modal onClose={handleCloseEdit}>
          <h2>Uredi Korisnika</h2>
          <EditForm onSubmit={handleSaveEdit}>
            <FormGroup>
              <Label>Ime i Prezime</Label>
              <Input
                type="text"
                value={editUsername}
                onChange={(e) => setEditUsername(e.target.value)}
                required
              />
            </FormGroup>
            <FormGroup>
              <Label>Email (ne može se mijenjati)</Label>
              <Input type="email" value={editingUser.email} disabled />
            </FormGroup>
            <FormGroup>
              <Label>Uloga</Label>
              <Select
                value={editRole}
                onChange={(e) =>
                  setEditRole(e.target.value as "admin" | "regular")
                }
              >
                <option value="regular">Običan korisnik</option>
                <option value="admin">Administrator</option>
              </Select>
            </FormGroup>
            {editError && <ErrorMessage>{editError}</ErrorMessage>}
            <SaveButton type="submit" disabled={saving}>
              {saving ? "Spremanje..." : "Spremi promjene"}
            </SaveButton>
          </EditForm>
        </Modal>
      )}
    </UsersContainer>
  );
};

export default Users;
