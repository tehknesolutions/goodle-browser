# HEPGA Package Specification — Proposal v0

## Purpose

HEPGA is the portable package format for a Goodle experience/project.

## Conceptual structure

project.hepga/
├── manifest
├── project
├── intent
├── plan
├── oldrewrite
├── oldtable
├── scenes
├── systems
├── assets
├── dependencies
├── permissions
├── tests
├── runtime
├── artifacts
└── provenance

## Goals

- portable
- inspectable
- versionable
- reproducible
- safe to import
- capable of preserving creation history

## Security

A HEPGA package must never implicitly grant host-machine capabilities merely because the package requests them.
