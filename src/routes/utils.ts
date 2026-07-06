
import jwt, { type SignOptions, type JwtPayload } from "jsonwebtoken";

const COMPETITION_TOKEN_SECRET = process.env.COMPETITION_TOKEN_SECRET!;

export interface CompetitionTokenPayload extends JwtPayload {
    competitionId: string;
    groupId: string;
    username: string;
}

export function signCompetitionToken(competitionId: string, groupId: string, username: string, options?: SignOptions) {
    return jwt.sign({ competitionId, groupId, username }, COMPETITION_TOKEN_SECRET, {
        expiresIn: "24h",
        ...options,
    });
}

export function verifyCompetitionToken(token: string): CompetitionTokenPayload | null {
    try {
        return jwt.verify(token, COMPETITION_TOKEN_SECRET) as CompetitionTokenPayload;
    } catch {
        return null;
    }
}