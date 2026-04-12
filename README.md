# Kuestiddles Backend Service

## Routes

- /api:
  - /auth:
  - /v2:
    - /settings
      - /avatars
    - /admin
      - /organizations
        - /:organizationSlug
          - /landmarks
          - /quests
          - /competitions  
          - /uploads
    - /user:
        - /organizations
          - /:organizationSlug
            - /landmarks
            - /quests
            - /competitions
      - /auth
        - /mobile
      - /statistics  

## Images and avatars

Avatars: <https://cdn.kuestiddles.com/avatars/><uuid_of_user>.webp
Images: <https://cdn.kuestiddles.com/images/><uuid_of_image>.webp

