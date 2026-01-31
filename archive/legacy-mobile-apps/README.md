# Legacy Mobile Apps (Archived)

These apps have been archived as of January 2024.

## Reason for Archive

The `*-app` mobile apps were replaced by the `*-mobile` apps which are now the **only supported mobile source**.

| Legacy App | Replacement |
|------------|-------------|
| `customer-app` | `apps/customer-mobile` |
| `driver-app` | `apps/driver-mobile` |
| `picker-app` | `apps/picker-mobile` |

## DO NOT USE

These apps are kept for historical reference only. All new development should use the `*-mobile` apps.

## Migration Notes

- All branding assets are now in `apps/*-mobile/assets/`
- Typography system uses AlArabiya (headings) and Decotype Naskh (body)
- Font loading is handled via expo-font in each app's `_layout.tsx`
