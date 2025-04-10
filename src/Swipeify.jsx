
import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

const clientId = import.meta.env.VITE_SPOTIFY_CLIENT_ID;
const redirectUri = import.meta.env.VITE_REDIRECT_URI;
const authEndpoint = "https://accounts.spotify.com/authorize";
const scopes = ["user-top-read", "user-library-modify"];

export default function Swipeify() {
  const [accessToken, setAccessToken] = useState(null);
  const [songs, setSongs] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [likedSongs, setLikedSongs] = useState([]);

  useEffect(() => {
    const hash = window.location.hash;
    let token = window.localStorage.getItem("spotifyToken");

    if (!token && hash) {
      token = new URLSearchParams(hash.replace("#", "")).get("access_token");
      window.location.hash = "";
      window.localStorage.setItem("spotifyToken", token);
    }

    setAccessToken(token);
  }, []);

  useEffect(() => {
    const savedLikes = JSON.parse(localStorage.getItem("likedSongs")) || [];
    setLikedSongs(savedLikes);
  }, []);

  useEffect(() => {
    if (!accessToken) return;

    fetch("https://api.spotify.com/v1/me/top/tracks?limit=10", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })
      .then((res) => res.json())
      .then((data) => {
        const tracks = data.items.map((track) => ({
          id: track.id,
          title: track.name,
          artist: track.artists[0].name,
          previewUrl: track.preview_url,
          albumArt: track.album.images[0].url,
        })).filter(t => t.previewUrl);
        setSongs(tracks);
      });
  }, [accessToken]);

  const handleLike = () => {
    const liked = [...likedSongs, songs[currentIndex]];
    setLikedSongs(liked);
    localStorage.setItem("likedSongs", JSON.stringify(liked));

    fetch("https://api.spotify.com/v1/me/tracks", {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ ids: [songs[currentIndex].id] }),
    }).catch((error) => console.error("Error saving to Spotify Library:", error));

    nextSong();
  };

  const handleDislike = () => {
    nextSong();
  };

  const nextSong = () => {
    if (currentIndex < songs.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      alert("You've reached the end of the list!");
    }
  };

  const resetLikes = () => {
    localStorage.removeItem("likedSongs");
    setLikedSongs([]);
  };

  const loginToSpotify = () => {
    window.location = `${authEndpoint}?client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scopes.join("%20")}&response_type=token&show_dialog=true`;
  };

  const currentSong = songs[currentIndex];

  if (!accessToken) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-gradient-to-br from-purple-600 via-indigo-500 to-blue-500 text-white">
        <h1 className="text-4xl font-bold mb-6">🎧 Swipeify</h1>
        <Button onClick={loginToSpotify} className="bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded-xl">
          Connect with Spotify
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-gradient-to-br from-purple-600 via-indigo-500 to-blue-500 text-white">
      <h1 className="text-4xl font-bold mb-8 drop-shadow-lg">🎧 Swipeify</h1>

      <AnimatePresence mode="wait">
        {currentSong && (
          <motion.div
            key={currentSong.id}
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            transition={{ duration: 0.4 }}
          >
            <Card className="w-80 bg-white text-black shadow-2xl rounded-3xl overflow-hidden">
              <img
                src={currentSong.albumArt}
                alt={currentSong.title}
                className="w-full h-60 object-cover"
              />
              <CardContent className="text-center px-4 py-5">
                <h2 className="text-2xl font-semibold mb-1">{currentSong.title}</h2>
                <p className="text-sm text-gray-600 mb-4">{currentSong.artist}</p>
                <audio controls className="w-full rounded-lg">
                  <source src={currentSong.previewUrl} type="audio/mpeg" />
                  Your browser does not support the audio element.
                </audio>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex gap-6 mt-6 mb-10">
        <Button
          variant="destructive"
          onClick={handleDislike}
          className="bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded-xl"
        >
          ❌ Dislike
        </Button>
        <Button
          onClick={handleLike}
          className="bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded-xl"
        >
          ❤️ Like
        </Button>
      </div>

      <div className="bg-white bg-opacity-10 backdrop-blur-md p-6 rounded-xl w-full max-w-md">
        <h2 className="text-2xl font-semibold mb-3 text-white drop-shadow">Your Liked Songs</h2>
        {likedSongs.length === 0 ? (
          <p className="text-gray-200">You haven't liked any songs yet.</p>
        ) : (
          <ul className="list-disc pl-6 text-white space-y-1">
            {likedSongs.map((song) => (
              <li key={song.id}>
                {song.title} – <span className="italic text-gray-300">{song.artist}</span>
              </li>
            ))}
          </ul>
        )}
        {likedSongs.length > 0 && (
          <Button
            variant="outline"
            className="mt-4 border-white text-white hover:bg-white hover:text-black"
            onClick={resetLikes}
          >
            Reset Liked Songs
          </Button>
        )}
      </div>
    </div>
  );
}
