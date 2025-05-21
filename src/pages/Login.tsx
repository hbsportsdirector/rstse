import React from 'react';
import LoginForm from '../components/Auth/LoginForm';

const Login = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <img
          className="mx-auto h-12 w-auto"
          src="/logo.svg"
          alt="Athlete Management System"
        />
        <LoginForm />
      </div>
    </div>
  );
};

export default Login;
