import React, { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
	const [user, setUser] = useState(null);
	const [token, setToken] = useState(localStorage.getItem("authToken"));
	const [loading, setLoading] = useState(true);

	const API_URL = import.meta.env.API_URL || "/api"; 

	useEffect(() => {
		if (token) {
			const storedUser = localStorage.getItem("authUser");
			if (storedUser) {
				setUser(JSON.parse(storedUser));
			}
		}
		setLoading(false);
	}, [token]);

	// Helper to hash password with SHA-256
	const hashPassword = async (password) => {
		const msgBuffer = new TextEncoder().encode(password);
		const hashBuffer = await crypto.subtle.digest("SHA-256", msgBuffer);
		const hashArray = Array.from(new Uint8Array(hashBuffer));
		const hashHex = hashArray
			.map((b) => b.toString(16).padStart(2, "0"))
			.join("");
		return hashHex;
	};

	const login = async (username, password) => {
		try {
			const hashedPassword = await hashPassword(password);

			const response = await fetch(`${API_URL}/login`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ username, password: hashedPassword }),
			});

			const data = await response.json();

			if (!response.ok) {
				throw new Error(data.error || "Login failed");
			}

			setToken(data.token);
			setUser({ username });
			localStorage.setItem("authToken", data.token);
			localStorage.setItem("authUser", JSON.stringify({ username }));
			return { success: true };
		} catch (error) {
			return { success: false, error: error.message };
		}
	};

	const register = async (username, password) => {
		try {
			const hashedPassword = await hashPassword(password);

			const response = await fetch(`${API_URL}/register`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ username, password: hashedPassword }),
			});

			const data = await response.json();

			if (!response.ok) {
				throw new Error(data.error || "Registration failed");
			}

			return { success: true };
		} catch (error) {
			return { success: false, error: error.message };
		}
	};

	const logout = () => {
		setUser(null);
		setToken(null);
		localStorage.removeItem("authToken");
		localStorage.removeItem("authUser");
	};

	return (
		<AuthContext.Provider
			value={{ user, token, login, register, logout, loading }}
		>
			{children}
		</AuthContext.Provider>
	);
};
