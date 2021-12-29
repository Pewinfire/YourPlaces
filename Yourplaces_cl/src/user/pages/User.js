import React from "react";
import UserList from "../components/UsersList";

const Users = () => {
  const USERS = [
    {
      id: "u1",
      name: "Sergio D",
      image:
        "https://pbs.twimg.com/profile_images/1009018578752897025/LLL98VAk_400x400.jpg",
      places: 3,
    },
  ];
  return <UserList items={USERS} />;
};

export default Users;
