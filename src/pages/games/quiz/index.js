import Head from 'next/head';
import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import ProfessionalHeader from '../../../components/ProfessionalHeader';
import { CATEGORIES } from '../../../data/quizConstants';
import GamesListScreen from './components/GamesListScreen';
import SetupScreen from './components/SetupScreen';
import WaitingScreen from './components/WaitingScreen';
import PlayScreen from './components/PlayScreen';
import ResultsScreen from './components/ResultsScreen';

export default function QuizGame() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [screen, setScreen] = useState('loading');
  const [games, setGames] = useState([]);
  const [currentGame, setCurrentGame] = useState(null);
  
  // Setup state
  const [playerCount, setPlayerCount] = useState(2);
  const [playerNames, setPlayerNames] = useState(['Player 1', 'Player 2']);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [customCategoryName, setCustomCategoryName] = useState('');
  const [customCategoryDescription, setCustomCategoryDescription] = useState('');
  const [numberOfQuestions, setNumberOfQuestions] = useState(10);
  const [difficulty, setDifficulty] = useState('medium');
  const [showCategorySelection, setShowCategorySelection] = useState(false);
  
  // Game play state
  const [playerAnswers, setPlayerAnswers] = useState({});
  const [showAnswer, setShowAnswer] = useState(false);
  const [isGeneratingQuestion, setIsGeneratingQuestion] = useState(false);
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    if (status === 'loading') return;

    if (session) {
      loadGames();
    } else {
      setScreen('setup');
    }
  }, [session, status]);

  const loadGames = async () => {
    try {
      const res = await fetch('/api/games');
      const data = await res.json();
      const quizGames = data.games.filter(g => g.gameType === 'quiz');
      setGames(quizGames);
      setScreen(quizGames.length > 0 ? 'games' : 'setup');
    } catch (error) {
      console.error('Failed to load games:', error);
      setScreen('setup');
    }
  };

  const handleNewGame = () => {
    setCurrentGame(null);
    setPlayerCount(2);
    setPlayerNames(['Player 1', 'Player 2']);
    setSelectedCategories([]);
    setCustomCategoryName('');
    setCustomCategoryDescription('');
    setNumberOfQuestions(10);
    setScreen('setup');
  };

  const handleContinueGame = (game) => {
    setCurrentGame(game);
    if (game.quizConfig && game.quizConfig.questions && game.quizConfig.questions.length > 0) {
      setScreen('play');
    } else {
      setScreen('waiting');
    }
  };

  const handleDeleteGame = async (gameId) => {
    if (!confirm('Are you sure you want to delete this game?')) return;

    try {
      await fetch(`/api/games/${gameId}`, { method: 'DELETE' });
      loadGames();
    } catch (error) {
      console.error('Failed to delete game:', error);
    }
  };

  const generateQuestions = async (categories = null, numQuestions = null, diffLevel = null) => {
    setIsGeneratingQuestion(true);
    try {
      const categoriesToUse = categories || (selectedCategories.length > 0 ? selectedCategories : ['General Knowledge']);
      const difficultyLevel = diffLevel || difficulty;
      const questionsPerCategory = Math.ceil((numQuestions || numberOfQuestions) / categoriesToUse.length);
      
      const difficultyInstructions = {
        easy: 'kids ages 5-10 with simple questions',
        medium: 'teenagers and adults with intermediate level questions',
        hard: 'very challenging questions for experienced players'
      };
      
      const categoryInstructions = categoriesToUse.map(cat => {
        if (cat.toLowerCase().includes('riddles')) {
          return 'For Riddles questions: Create actual riddles (clever word puzzles to solve), not questions about riddles. Examples: "I speak without a mouth and hear without ears. What am I?" (Answer: an echo), or "What has keys but no locks, space but no room, and you can enter but not go inside?" (Answer: a keyboard).';
        }
        return null;
      }).filter(Boolean);
      
      const prompt = `Generate ${numQuestions || numberOfQuestions} challenging multiple choice quiz questions in pub quiz style with the following specifications:
- Categories: ${categoriesToUse.join(', ')}
- ${categoriesToUse.length > 1 ? `Generate approximately ${questionsPerCategory} questions per category` : 'Generate all questions for this category'}
- Each question should have exactly 5 options (A, B, C, D, E)
- Difficulty level: ${difficultyInstructions[difficultyLevel]}
- Questions should be testing and challenging - the kind you'd find at a difficult pub quiz
- Make distractors very plausible and close to the correct answer
- Avoid obvious or too-easy questions
- Include one correct answer and four very plausible distractors
- Questions should test actual knowledge, not trivial facts
${categoryInstructions.length > 0 ? '- SPECIAL INSTRUCTIONS: ' + categoryInstructions.join('. ') : ''}

For each question, provide the following in JSON format:
{
  "question": "The question text here",
  "options": ["Option A", "Option B", "Option C", "Option D", "Option E"],
  "correctAnswer": 0,
  "category": "Category name",
  "explanation": "An interesting fact or explanation about the answer"
}

Return ONLY a JSON array of questions, no additional text or formatting.`;

      const response = await fetch('/api/claude', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, useCache: false })
      });

      if (!response.ok) {
        throw new Error('Failed to generate questions');
      }

      const result = await response.json();
      
      // Helper function to safely parse JSON
      const tryParseJSON = (text) => {
        let cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        
        // First try to find and parse the JSON array
        const arrayMatch = cleaned.match(/\[[\s\S]*\]/);
        if (arrayMatch) {
          try {
            let jsonStr = arrayMatch[0];
            
            // Fix common JSON issues
            // Remove trailing commas
            jsonStr = jsonStr.replace(/,(\s*[}\]])/g, '$1');
            // Fix unclosed strings
            jsonStr = jsonStr.replace(/:\s*"([^"]*)"/g, ': "$1"');
            
            return JSON.parse(jsonStr);
          } catch (e) {
            console.error('Failed to parse matched array:', e);
            console.error('Problematic JSON:', arrayMatch[0].substring(0, 200));
          }
        }
        
        // If array parsing failed, try to extract individual question objects
        const questionPattern = /\{\s*"[^"]+":\s*"[^"]*"[^{}]*\}/g;
        const questionMatches = cleaned.match(questionPattern);
        
        if (questionMatches && questionMatches.length > 0) {
          const questions = questionMatches.map(match => {
            try {
              let fixed = match;
              
              // Ensure it's valid JSON
              fixed = fixed.replace(/,(\s*[}\]])/g, '$1');
              
              // Check if all required fields are present
              const hasQuestion = fixed.includes('"question"');
              const hasOptions = fixed.includes('"options"');
              const hasCorrectAnswer = fixed.includes('"correctAnswer"');
              
              if (!hasQuestion || !hasOptions || !hasCorrectAnswer) {
                return null;
              }
              
              // Add missing optional fields
              if (!fixed.includes('"category"')) {
                fixed = fixed.replace(/}$/, ', "category": "General"}');
              }
              if (!fixed.includes('"explanation"')) {
                fixed = fixed.replace(/}$/, ', "explanation": ""}');
              }
              
              return JSON.parse(fixed);
            } catch (e) {
              console.error('Failed to parse individual question:', e);
              return null;
            }
          }).filter(Boolean);
          
          if (questions.length > 0) {
            return questions;
          }
        }
        
        return null;
      };
      
      let questions;
      try {
        questions = tryParseJSON(result);
        
        if (!questions) {
          throw new Error('Could not extract questions');
        }
      } catch (error) {
        console.error('Failed to parse questions:', error);
        console.error('Raw response:', result);
        throw new Error('Failed to generate questions. Please try again.');
      }

      if (!Array.isArray(questions)) {
        questions = [questions];
      }

      return questions;
    } catch (error) {
      console.error('Error generating questions:', error);
      throw error;
    } finally {
      setIsGeneratingQuestion(false);
    }
  };

  const handleStartGame = async () => {
    try {
      const categoriesToSave = selectedCategories.map(cat => {
        if (cat === 'custom') {
          return `${customCategoryName}: ${customCategoryDescription}`;
        }
        return CATEGORIES.find(c => c.id === cat)?.name || cat;
      });

      const gameData = {
        gameType: 'quiz',
        players: playerNames, // API expects array of strings
        quizConfig: {
          categories: categoriesToSave,
          totalQuestions: numberOfQuestions,
          difficulty: difficulty,
          currentQuestionIndex: 0,
          currentRound: 1,
          rounds: [],
          questions: []
        }
      };

      let game;
      if (session) {
        const res = await fetch('/api/games', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(gameData)
        });
        
        if (!res.ok) {
          throw new Error(`Failed to create game: ${res.status}`);
        }
        
        const data = await res.json();
        game = data?.game;
        
        if (!game) {
          console.error('Game creation failed, response:', data);
          throw new Error('Failed to create game - no game returned from API');
        }
        
        // Ensure quizConfig exists in the returned game
        if (!game.quizConfig) {
          game.quizConfig = gameData.quizConfig;
        }
      } else {
        game = {
          _id: 'guest',
          gameType: 'quiz',
          players: playerNames.map(name => ({ name, scores: [], roundScores: [] })),
          quizConfig: {
            categories: categoriesToSave,
            totalQuestions: numberOfQuestions,
            difficulty: difficulty,
            currentQuestionIndex: 0,
            currentRound: 1,
            rounds: [],
            questions: []
          }
        };
      }

      setCurrentGame(game);
      setScreen('waiting');
      
      const questions = await generateQuestions();
      
      const updatedGame = {
        ...game,
        quizConfig: {
          ...game.quizConfig,
          questions: questions
        }
      };

      setCurrentGame(updatedGame);

      if (session && game._id !== 'guest') {
        try {
          await fetch(`/api/games/${game._id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              quizConfig: {
                ...updatedGame.quizConfig,
                rounds: [
                  {
                    roundNumber: updatedGame.quizConfig.currentRound || 1,
                    categories: categoriesToSave,
                    questions: questions
                  }
                ]
              },
              players: updatedGame.players
            })
          });
        } catch (error) {
          console.error('Failed to save game:', error);
        }
      }

      setScreen('play');
    } catch (error) {
      console.error('Failed to start game:', error);
      showNotification('Failed to generate questions. Please try again.');
    }
  };

  const showNotification = (message) => {
    setNotification(message);
    setTimeout(() => setNotification(null), 3000);
  };

  const handleSubmitAnswer = (playerIndex, answerIndex) => {
    setPlayerAnswers({
      ...playerAnswers,
      [playerIndex]: answerIndex
    });
  };

  const handleRevealAnswer = async () => {
    setShowAnswer(true);
    
    // Calculate and update scores immediately when revealing answer
    const currentQIndex = currentGame.quizConfig.currentQuestionIndex;
    const currentQuestion = currentGame.quizConfig.questions[currentQIndex];
    
    const updatedPlayers = currentGame.players.map((player, index) => {
      const playerAnswer = playerAnswers[index];
      const isCorrect = playerAnswer === currentQuestion.correctAnswer;
      
      // Accumulate scores across all rounds
      const newScores = [...player.scores, isCorrect ? 1 : 0];
      
      // Calculate round scores
      const currentRoundNumber = currentGame.quizConfig.currentRound;
      const roundScores = player.roundScores || [];
      
      // Update round score if this is the first question of the round
      const updatedRoundScores = [...roundScores];
      while (updatedRoundScores.length < currentRoundNumber) {
        updatedRoundScores.push(0);
      }
      
      return {
        ...player,
        scores: newScores,
        roundScores: updatedRoundScores
      };
    });

    const updatedGame = {
      ...currentGame,
      players: updatedPlayers
    };

    setCurrentGame(updatedGame);

    // Save to database if logged in
    if (session && currentGame._id !== 'guest') {
      try {
        await fetch(`/api/games/${currentGame._id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ players: updatedPlayers })
        });
      } catch (error) {
        console.error('Failed to save game:', error);
      }
    }
  };

  const handleNextQuestion = async () => {
    const currentQIndex = currentGame.quizConfig.currentQuestionIndex;
    
    const updatedGame = {
      ...currentGame,
      quizConfig: {
        ...currentGame.quizConfig,
        currentQuestionIndex: currentQIndex + 1
      }
    };

    setCurrentGame(updatedGame);
    setPlayerAnswers({});
    setShowAnswer(false);

    if (currentQIndex + 1 >= currentGame.quizConfig.questions.length) {
      setScreen('results');
    }

    if (session && currentGame._id !== 'guest') {
      try {
        await fetch(`/api/games/${currentGame._id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            quizConfig: updatedGame.quizConfig
          })
        });
      } catch (error) {
        console.error('Failed to save game:', error);
      }
    }
  };

  const handleStartNewRound = async (newCategories = null, newDifficulty = null) => {
    setShowCategorySelection(false);
    setScreen('waiting');
    setPlayerAnswers({});
    setShowAnswer(false);
    
    try {
      const gameCategories = newCategories || currentGame.quizConfig.categories.map(cat => {
        if (cat.includes(':')) {
          return 'Custom';
        }
        return cat;
      });
      
      const questions = await generateQuestions(gameCategories, currentGame.quizConfig.totalQuestions, newDifficulty || currentGame.quizConfig.difficulty);
      const nextRound = currentGame.quizConfig.currentRound + 1;
      
      // Keep all existing scores - don't reset!
      const updatedGame = {
        ...currentGame,
        quizConfig: {
          ...currentGame.quizConfig,
          currentQuestionIndex: 0,
          currentRound: nextRound,
          rounds: [
            ...(currentGame.quizConfig.rounds || []),
            {
              roundNumber: nextRound,
              categories: gameCategories,
              questions: questions
            }
          ],
          questions: questions
        }
      };

      setCurrentGame(updatedGame);

      if (session && currentGame._id !== 'guest') {
        try {
          await fetch(`/api/games/${currentGame._id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              quizConfig: updatedGame.quizConfig
            })
          });
        } catch (error) {
          console.error('Failed to save game:', error);
        }
      }

      setScreen('play');
    } catch (error) {
      console.error('Failed to generate questions:', error);
      showNotification('Failed to generate new questions. Please try again.');
      setScreen('results');
    }
  };

  const handleEndGame = async () => {
    if (session && currentGame._id !== 'guest') {
      try {
        await fetch(`/api/games/${currentGame._id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'completed' })
        });
      } catch (error) {
        console.error('Failed to end game:', error);
      }
    }
    router.push('/');
  };

  if (screen === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-100 via-pink-50 to-blue-100 flex items-center justify-center">
        <div className="text-2xl text-purple-600">Loading...</div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Quiz Game - Gamepad</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <main className="min-h-screen bg-gradient-to-br from-purple-100 via-pink-50 to-blue-100">
        <ProfessionalHeader />

        {notification && (
          <div className="fixed top-24 left-1/2 transform -translate-x-1/2 z-50 animate-bounce">
            <div className="bg-gradient-to-r from-yellow-400 to-orange-400 text-white px-8 py-4 rounded-full shadow-2xl text-lg font-bold">
              {notification}
            </div>
          </div>
        )}

        <div className="pt-4 px-4 pb-8">
          {screen === 'games' && (
            <GamesListScreen
              games={games}
              onNewGame={handleNewGame}
              onContinueGame={handleContinueGame}
              onDeleteGame={handleDeleteGame}
            />
          )}

          {screen === 'setup' && (
            <SetupScreen
              playerCount={playerCount}
              playerNames={playerNames}
              selectedCategories={selectedCategories}
              customCategoryName={customCategoryName}
              customCategoryDescription={customCategoryDescription}
              numberOfQuestions={numberOfQuestions}
              difficulty={difficulty}
              onPlayerCountChange={(count) => {
                setPlayerCount(count);
                setPlayerNames(Array.from({ length: count }, (_, i) => `Player ${i + 1}`));
              }}
              onPlayerNameChange={(index, name) => {
                const newNames = [...playerNames];
                newNames[index] = name;
                setPlayerNames(newNames);
              }}
              onCategoryToggle={(categoryId) => {
                if (categoryId === 'custom') {
                  setSelectedCategories(prev => 
                    prev.includes('custom') 
                      ? prev.filter(c => c !== 'custom')
                      : [...prev, 'custom']
                  );
                } else {
                  setSelectedCategories(prev => 
                    prev.includes(categoryId)
                      ? prev.filter(c => c !== categoryId && c !== 'custom')
                      : [...prev, categoryId]
                  );
                }
              }}
              onCustomCategoryNameChange={setCustomCategoryName}
              onCustomCategoryDescriptionChange={setCustomCategoryDescription}
              onNumberOfQuestionsChange={setNumberOfQuestions}
              onDifficultyChange={setDifficulty}
              onStart={handleStartGame}
              onBack={() => session ? loadGames() : router.push('/')}
              isGenerating={isGeneratingQuestion}
            />
          )}

          {screen === 'waiting' && isGeneratingQuestion && (
            <WaitingScreen />
          )}

          {screen === 'play' && currentGame && (
            <PlayScreen
              game={currentGame}
              playerAnswers={playerAnswers}
              showAnswer={showAnswer}
              onAnswerSelect={handleSubmitAnswer}
              onRevealAnswer={handleRevealAnswer}
              onNextQuestion={handleNextQuestion}
              onBack={() => router.push('/')}
            />
          )}

          {screen === 'results' && currentGame && (
            <ResultsScreen
              game={currentGame}
              onStartNewRound={handleStartNewRound}
              onEndGame={handleEndGame}
              onBack={() => router.push('/')}
            />
          )}
        </div>
      </main>
    </>
  );
}

