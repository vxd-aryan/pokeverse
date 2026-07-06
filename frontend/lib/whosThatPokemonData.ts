export interface MysteryPokemon {
  id: number;
  name: string;
  imageUrl: string;
  options: string[];
}

export const MYSTERY_POKEMON: MysteryPokemon[] = [
  {
    id: 25,
    name: "Pikachu",
    imageUrl: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/25.png",
    options: ["Pikachu", "Raichu", "Pichu", "Plusle"]
  },
  {
    id: 6,
    name: "Charizard",
    imageUrl: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/6.png",
    options: ["Dragonite", "Charizard", "Salamence", "Aerodactyl"]
  },
  {
    id: 94,
    name: "Gengar",
    imageUrl: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/94.png",
    options: ["Haunter", "Gengar", "Clefable", "Snorlax"]
  },
  {
    id: 130,
    name: "Gyarados",
    imageUrl: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/130.png",
    options: ["Milotic", "Gyarados", "Lapras", "Seadra"]
  }
];