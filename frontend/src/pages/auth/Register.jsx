import { useState } from "react";
import { useNavigate } from "react-router-dom";
import GlassCard from "../../components/ui/GlassCard";
import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";
import { registerUser } from "../../services/api";

export default function Register() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    username: "",
    firstname: "",
    lastname: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (form.password !== form.confirmPassword) {
      alert("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      await registerUser({
        username: form.username,
        email: form.email,
        password: form.password,
        fullname: {
          firstname: form.firstname,
          lastname: form.lastname,
        },
      });
      navigate("/login");
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <GlassCard className="w-full max-w-md">
        <h2 className="text-2xl text-center mb-6">Create DecMo Account</h2>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input label="Username" name="username" onChange={handleChange} />
          <Input label="First Name" name="firstname" onChange={handleChange} />
          <Input label="Last Name" name="lastname" onChange={handleChange} />
          <Input label="Email" name="email" onChange={handleChange} />
          <Input label="Password" type="password" name="password" onChange={handleChange} />
          <Input label="Confirm Password" type="password" name="confirmPassword" onChange={handleChange} />

          <Button loading={loading}>Register</Button>
        </form>
      </GlassCard>
    </div>
  );
}
