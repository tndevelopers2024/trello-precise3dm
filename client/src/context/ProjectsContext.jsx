import { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import api from "../api/axios.js";
import { useAuth } from "./AuthContext.jsx";

const ProjectsContext = createContext(null);

export function ProjectsProvider({ children }) {
  const { user } = useAuth();
  const [boards, setBoards] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const inFlightPromiseRef = useRef(null);
  const abortControllerRef = useRef(null);

  const fetchBoards = useCallback(
    async (force = false) => {
      if (!user?._id) {
        setBoards([]);
        setLoading(false);
        return [];
      }

      // Return ongoing request if one is in flight and not forcing refresh
      if (inFlightPromiseRef.current && !force) {
        return inFlightPromiseRef.current;
      }

      // If forcing refresh, cancel previous in-flight request
      if (force && abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      const controller = new AbortController();
      abortControllerRef.current = controller;
      setLoading(true);
      setError(null);

      const promise = api
        .get("/boards", { signal: controller.signal })
        .then((res) => {
          if (Array.isArray(res.data)) {
            setBoards(res.data);
            setError(null);
            return res.data;
          }
          return [];
        })
        .catch((err) => {
          if (err.name === "CanceledError" || err.code === "ERR_CANCELED") {
            return [];
          }
          console.error("Failed to load projects:", err);
          setError(err.response?.data?.message || "Failed to load projects");
          throw err;
        })
        .finally(() => {
          if (inFlightPromiseRef.current === promise) {
            inFlightPromiseRef.current = null;
          }
          setLoading(false);
        });

      inFlightPromiseRef.current = promise;
      return promise;
    },
    [user?._id]
  );

  const updateBoard = useCallback((updatedBoard) => {
    if (!updatedBoard?._id) return;
    setBoards((prev) =>
      prev.map((b) => (b._id === updatedBoard._id ? { ...b, ...updatedBoard } : b))
    );
  }, []);

  const removeBoard = useCallback((boardId) => {
    if (!boardId) return;
    setBoards((prev) => prev.filter((b) => b._id !== boardId));
  }, []);

  const addBoard = useCallback((newBoard) => {
    if (!newBoard?._id) return;
    setBoards((prev) => {
      const exists = prev.some((b) => b._id === newBoard._id);
      if (exists) {
        return prev.map((b) => (b._id === newBoard._id ? { ...b, ...newBoard } : b));
      }
      return [newBoard, ...prev];
    });
  }, []);

  // Initial load when user becomes available or user ID changes
  useEffect(() => {
    if (!user?._id) {
      setBoards([]);
      return;
    }
    fetchBoards(false).catch(() => {});

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [user?._id, fetchBoards]);

  return (
    <ProjectsContext.Provider
      value={{
        boards,
        setBoards,
        loading,
        error,
        fetchBoards,
        updateBoard,
        removeBoard,
        addBoard,
      }}
    >
      {children}
    </ProjectsContext.Provider>
  );
}

export function useProjects() {
  const context = useContext(ProjectsContext);
  if (!context) {
    throw new Error("useProjects must be used within a ProjectsProvider");
  }
  return context;
}

