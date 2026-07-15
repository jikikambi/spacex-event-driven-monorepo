import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { passportJwtSecret } from 'jwks-rsa';
import { Algorithm } from 'jsonwebtoken';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {

    constructor(private readonly configService: ConfigService) {

        super({

            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),

            secretOrKeyProvider:
                passportJwtSecret({
                    cache: true,
                    rateLimit: true,
                    jwksRequestsPerMinute: 5,
                    jwksUri: configService.getOrThrow<string>('KEYCLOAK_JWKS_URI')
                }),
            issuer: configService.getOrThrow<string>('KEYCLOAK_ISSUER'),
            algorithms: [ configService.get<string>('KEYCLOAK_ALGORITHM', 'RS256') as Algorithm]
        });
    }

    validate(payload: any) {

        return {
            id: payload.sub,
            username: payload.preferred_username,
            roles: payload.realm_access?.roles
        };
    }
}