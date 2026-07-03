# Kuestiddles Backend Service

This is main backend service used by Kuestiddles application frontend (Admin) and mobile application (Competition User)

# Main features
- API for managing all entities in the system: landmarks, uploads, quests, competitions
- API for participating in competitions made for competition's users

## API Routes - Admin

- /admin:
    - /v3:
        - POST / - create organization
        - /uploads:
            - GET /search
            - GET /:id/metadata
            - GET /:id/data
            - GET /:slug/metadata
            - POST /
            - DELETE /:id
            - DELETE /:slug
        - /games:
            - GET /search
            - GET /:id
            - GET /:slug
            - DELETE /:id
            - DELETE /:slug
            - POST /
            - PATCH /:id
            - PATCH /:id/assets
    
        - /landmarks:

        - /quests:
            
        - /competitions:
    - /payments:
        - GET /
        - POST /upgrade


# TODO List
- Add usage limits to all resources: landmarks, uploads, quests and competitions
- 
- 
- 
