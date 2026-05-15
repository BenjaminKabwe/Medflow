"use client";

import { Activity } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import React, { useEffect, useState } from "react";

const slides = [
  {
    src: "https://res.cloudinary.com/duudvnkg8/image/upload/v1776841005/Doctor_zmeij1.jpg",
    caption: "Des soins d'excellence, toujours accessibles",
    sub: "Suivi patient en temps réel",
  },
  {
    src: "https://res.cloudinary.com/duudvnkg8/image/upload/v1776836751/Medical_Team_Photography_j6kn52.jpg",
    caption: "Une équipe médicale connectée",
    sub: "Collaboration et coordination simplifiées",
  },
  {
    src: "https://res.cloudinary.com/duudvnkg8/image/upload/v1776836752/t%C3%A9l%C3%A9chargement_1_gdxobf.jpg",
    caption: "La technologie au service de la santé",
    sub: "Dossiers médicaux numériques sécurisés",
  },
  {
    src: "https://res.cloudinary.com/duudvnkg8/image/upload/v1776836752/Gr%C3%A1fico_do_mercado_de_a%C3%A7%C3%B5es_na_tela_virtual_com_remix_digital_de_m%C3%A3o_de_mulher_tbqjsn.jpg",
    caption: "Analytique médicale avancée",
    sub: "Prenez des décisions éclairées",
  },
];

const AuthLayout = ({ children }: { children: React.ReactNode }) => {
  const [index, setIndex] = useState(0);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setFading(true);
      setTimeout(() => {
        setIndex((prev) => (prev + 1) % slides.length);
        setFading(false);
      }, 400);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const current = slides[index];

  return (
    <div className="w-full h-screen flex overflow-hidden bg-white">
      {/* ── Left panel ── */}
      <div className="w-full md:w-1/2 h-full flex flex-col">
        {/* Logo bar */}
        <div className="flex-shrink-0 px-8 pt-6 pb-4">
          <Link href="/" className="inline-flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center shadow-md">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold text-slate-800 tracking-tight">
              MedFlow
            </span>
          </Link>
        </div>

        {/* Form — centré verticalement dans l'espace restant */}
        <div className="flex-1 flex items-center justify-center px-6 py-4">
          {children}
        </div>
      </div>

      {/* ── Right panel — carousel ── */}
      <div className="hidden md:block w-1/2 h-full relative overflow-hidden">
        <Image
          src={current.src}
          fill
          alt="Illustration médicale"
          priority
          className={`object-cover transition-opacity duration-500 ${
            fading ? "opacity-0" : "opacity-100"
          }`}
        />

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/20 to-transparent" />

        {/* Brand top-left */}
        <div className="absolute top-7 left-7 z-10 flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center">
            <Activity className="w-4 h-4 text-white" />
          </div>
          <span className="text-white font-bold text-base">MedFlow</span>
        </div>

        {/* Caption bottom */}
        <div
          className={`absolute bottom-10 left-8 right-8 z-10 transition-all duration-500 ${
            fading ? "opacity-0 translate-y-2" : "opacity-100 translate-y-0"
          }`}
        >
          <p className="text-xs text-sky-300 uppercase tracking-widest font-semibold mb-1">
            {current.sub}
          </p>
          <h2 className="text-xl font-bold text-white leading-snug">
            {current.caption}
          </h2>
        </div>

        {/* Dot indicators */}
        <div className="absolute bottom-5 left-8 z-10 flex gap-2">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setIndex(i)}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === index ? "w-6 bg-white" : "w-1.5 bg-white/40 hover:bg-white/60"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
