# Goodle Game Design Document (GDD)

## Product identity

Goodle is not itself a single game. It is a creation/runtime platform capable of producing games.

## Game-creation philosophy

A game generated in Goodle should have a separable Game Core when practical:

Game Core → simulation → digital manifestation → optional physical manifestation.

The Q'Worlox project is an important reference for this principle: game rules can be kept independent from presentation and tested through a headless simulator.

## Game systems supported by the platform model

- entities
- world/board graph
- movement
- combat
- inventory
- cards
- events
- quests
- progression
- victory conditions
- UI
- audio
- assets
- deterministic simulation

## Design status

These are platform capabilities, not fixed rules for every generated game. The generated project owns its own game rules.

## Design requirement

Goodle must avoid confusing a reference game's experimental mechanics with universal Goodle mechanics.
