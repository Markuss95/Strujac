// src/pages/Users/index.tsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import styled from "styled-components";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../../config/firebase";
import { User } from "../../types";

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

const NoUsersMessage = styled.div`
  text-align: center;
  padding: 2rem;
  color: #666;
  font-style: italic;
`;

const Users: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "test"), (snapshot) => {
      // Change "users" to "test"
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
  }, []);

  return (
    <UsersContainer>
      <Header>
        <Title>Lista Korisnika</Title>
        <BackButton onClick={() => navigate("/")}>
          Nazad na Dashboard
        </BackButton>
      </Header>
      {users.length > 0 ? (
        <UsersTable>
          <TableHead>
            <TableRow>
              <TableHeader>Ime i Prezime</TableHeader>
              <TableHeader>Email</TableHeader>
            </TableRow>
          </TableHead>
          <tbody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>{user.username}</TableCell>
                <TableCell>{user.email}</TableCell>
              </TableRow>
            ))}
          </tbody>
        </UsersTable>
      ) : (
        <NoUsersMessage>Nema dostupnih korisnika za prikaz.</NoUsersMessage>
      )}
    </UsersContainer>
  );
};

export default Users;
