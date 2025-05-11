import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { login, signup } from "./actions";

export default function LoginPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-2">
      <div className="p-8 bg-white shadow-md rounded-lg w-full max-w-md">
        <h1 className="text-2xl font-semibold text-center mb-6">
          Login / Sign Up
        </h1>
        <form className="space-y-6">
          <div>
            <Label htmlFor="email">Email:</Label>
            <Input
              id="email"
              name="email"
              type="email"
              required
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="password">Password:</Label>
            <Input
              id="password"
              name="password"
              type="password"
              required
              className="mt-1"
            />
          </div>
          <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2">
            <Button formAction={login} className="flex-1">
              Log in
            </Button>
            <Button formAction={signup} variant="outline" className="flex-1">
              Sign up
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
