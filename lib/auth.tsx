"use client"

import type React from "react"
import { useState, useEffect, createContext, useContext } from "react"
import type { User } from "@/types/course"
import { createUser, getUserByEmail } from "./database"

interface AuthContextType {
  user: User | null
  login: (email: string, password: string) => Promise<boolean>
  register: (name: string, email: string, password: string) => Promise<boolean>
  logout: () => void
  loading: boolean
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check for saved user session
    const savedUser = localStorage.getItem("user")
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser))
      } catch (error) {
        console.error("Error parsing saved user:", error)
        localStorage.removeItem("user")
      }
    }
    setLoading(false)
  }, [])

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      console.log("Attempting login for:", email)

      // Check if user exists in database
      const dbUser = await getUserByEmail(email)

      if (dbUser) {
        console.log("User found in database")
        const appUser: User = {
          id: dbUser.id,
          name: dbUser.name,
          email: dbUser.email,
          avatar: dbUser.avatar_url,
          createdAt: new Date(dbUser.created_at),
        }
        setUser(appUser)
        localStorage.setItem("user", JSON.stringify(appUser))
        return true
      } else {
        console.log("User not found, creating new user")
        // Create user if doesn't exist (for demo purposes)
        const newDbUser = await createUser({
          email,
          name: email.split("@")[0],
        })

        if (newDbUser) {
          console.log("New user created successfully")
          const appUser: User = {
            id: newDbUser.id,
            name: newDbUser.name,
            email: newDbUser.email,
            avatar: newDbUser.avatar_url,
            createdAt: new Date(newDbUser.created_at),
          }
          setUser(appUser)
          localStorage.setItem("user", JSON.stringify(appUser))
          return true
        } else {
          console.error("Failed to create new user")
        }
      }
      return false
    } catch (error) {
      console.error("Login error:", error)
      return false
    }
  }

  const register = async (name: string, email: string, password: string): Promise<boolean> => {
    try {
      console.log("Attempting registration for:", email)

      // Check if user already exists
      const existingUser = await getUserByEmail(email)
      if (existingUser) {
        console.log("User already exists")
        return false // User already exists
      }

      // Create new user
      const newDbUser = await createUser({
        email,
        name,
      })

      if (newDbUser) {
        console.log("Registration successful")
        const appUser: User = {
          id: newDbUser.id,
          name: newDbUser.name,
          email: newDbUser.email,
          avatar: newDbUser.avatar_url,
          createdAt: new Date(newDbUser.created_at),
        }
        setUser(appUser)
        localStorage.setItem("user", JSON.stringify(appUser))
        return true
      }
      return false
    } catch (error) {
      console.error("Registration error:", error)
      return false
    }
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem("user")
  }

  return <AuthContext.Provider value={{ user, login, register, logout, loading }}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider")
  }
  return context
}
