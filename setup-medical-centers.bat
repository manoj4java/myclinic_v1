@echo off
echo 🏥 Setting up Medical Centers...
echo.

echo 📝 Step 1: Creating medical_centers table...
npx tsx setup-db-medical-centers.ts

echo.
echo 📝 Step 2: Seeding initial data...
npx tsx seed-medical-centers.ts

echo.
echo ✨ Medical Centers setup completed!
echo 🎉 You can now:
echo    - Visit /medical-centers page to manage centers (Super Admin only)
echo    - Use the center dropdown in Add Patient form
echo    - See center info in Patient Management grid
echo.
pause