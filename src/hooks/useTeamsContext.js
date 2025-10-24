import { useState, useEffect } from 'react';

/**
 * Hook to detect if the app is running inside Microsoft Teams
 * and retrieve Teams context information
 *
 * @returns {Object} { isTeams, teamsContext, isLoading, error }
 */
export function useTeamsContext() {
  const [isTeams, setIsTeams] = useState(false);
  const [teamsContext, setTeamsContext] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const initializeTeams = async () => {
      try {
        // Check if Teams SDK is available
        if (typeof window === 'undefined' || !window.microsoftTeams) {
          setIsTeams(false);
          setIsLoading(false);
          return;
        }

        const microsoftTeams = window.microsoftTeams;

        // Initialize the Teams SDK
        await microsoftTeams.app.initialize();

        // Get the Teams context
        const context = await microsoftTeams.app.getContext();

        setIsTeams(true);
        setTeamsContext(context);
        setIsLoading(false);
      } catch (err) {
        console.error('Error initializing Teams context:', err);
        setError(err);
        setIsTeams(false);
        setIsLoading(false);
      }
    };

    initializeTeams();
  }, []);

  return { isTeams, teamsContext, isLoading, error };
}
