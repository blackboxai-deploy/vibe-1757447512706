import requests
import sys
import json
from datetime import datetime
import uuid

class LimpopoClassifiedsAPITester:
    def __init__(self, base_url="https://f2ee55db-5613-4318-b62f-a892cf305687.preview.emergentagent.com"):
        self.base_url = base_url
        self.tests_run = 0
        self.tests_passed = 0
        self.test_user_id = None
        self.test_ad_id = None

    def run_test(self, name, method, endpoint, expected_status, data=None, files=None, is_form_data=False):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        headers = {}
        
        # Only set Content-Type for JSON, let requests handle form data
        if not files and not is_form_data:
            headers['Content-Type'] = 'application/json'

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers)
            elif method == 'POST':
                if files or is_form_data:
                    # Send as form data (multipart/form-data)
                    response = requests.post(url, data=data, files=files)
                else:
                    # Send as JSON
                    response = requests.post(url, json=data, headers=headers)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    response_data = response.json()
                    print(f"   Response: {json.dumps(response_data, indent=2)}")
                    return True, response_data
                except:
                    return True, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    error_data = response.json()
                    print(f"   Error: {json.dumps(error_data, indent=2)}")
                except:
                    print(f"   Error: {response.text}")
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_health_check(self):
        """Test health endpoint"""
        success, response = self.run_test(
            "Health Check",
            "GET",
            "api/health",
            200
        )
        return success

    def test_get_categories(self):
        """Test categories endpoint"""
        success, response = self.run_test(
            "Get Categories",
            "GET", 
            "api/categories",
            200
        )
        if success and 'categories' in response:
            expected_categories = [
                "Men Seeking Women", "Women Seeking Men", "Men Seeking Men",
                "Women Seeking Women", "Casual Encounters", "Adult Services"
            ]
            if all(cat in response['categories'] for cat in expected_categories):
                print("   ✅ All expected categories found")
                return True
            else:
                print("   ❌ Missing expected categories")
                return False
        return success

    def test_get_locations(self):
        """Test locations endpoint"""
        success, response = self.run_test(
            "Get Locations",
            "GET",
            "api/locations", 
            200
        )
        if success and 'locations' in response:
            expected_locations = ["Polokwane", "Makhado (Louis Trichardt)", "Tzaneen"]
            if any(loc in response['locations'] for loc in expected_locations):
                print("   ✅ Expected Limpopo locations found")
                return True
            else:
                print("   ❌ Missing expected Limpopo locations")
                return False
        return success

    def test_user_registration(self):
        """Test user registration"""
        self.test_email = f"test_{uuid.uuid4().hex[:8]}@example.com"
        success, response = self.run_test(
            "User Registration",
            "POST",
            "api/register",
            200,
            data={
                "name": "Test User",
                "email": self.test_email,
                "password": "TestPass123!",
                "age": 25,
                "location": "Polokwane"
            }
        )
        if success and 'user_id' in response:
            self.test_user_id = response['user_id']
            print(f"   ✅ User registered with ID: {self.test_user_id}")
            return True
        return success

    def test_duplicate_registration(self):
        """Test duplicate email registration"""
        if not hasattr(self, 'test_email'):
            print("   ⚠️ Skipping - no test email stored")
            return True
            
        success, response = self.run_test(
            "Duplicate Registration (should fail)",
            "POST", 
            "api/register",
            400,  # Should fail with 400
            data={
                "name": "Another User",
                "email": self.test_email,  # Same email as first registration
                "password": "TestPass123!",
                "location": "Tzaneen"
            }
        )
        return success

    def test_user_login(self):
        """Test user login"""
        if not self.test_user_id:
            print("   ⚠️ Skipping - no test user created")
            return True
            
        # We need to use a known email for login test
        test_email = f"login_test_{uuid.uuid4().hex[:8]}@example.com"
        
        # First register a user for login test
        reg_success, reg_response = self.run_test(
            "Register User for Login Test",
            "POST",
            "api/register", 
            200,
            data={
                "name": "Login Test User",
                "email": test_email,
                "password": "LoginTest123!",
                "location": "Polokwane"
            }
        )
        
        if not reg_success:
            return False
            
        # Now test login
        success, response = self.run_test(
            "User Login",
            "POST",
            "api/login",
            200,
            data={
                "email": test_email,
                "password": "LoginTest123!"
            }
        )
        return success

    def test_invalid_login(self):
        """Test login with invalid credentials"""
        success, response = self.run_test(
            "Invalid Login (should fail)",
            "POST",
            "api/login", 
            401,  # Should fail with 401
            data={
                "email": "nonexistent@example.com",
                "password": "wrongpassword"
            }
        )
        return success

    def test_create_ad(self):
        """Test ad creation"""
        if not self.test_user_id:
            print("   ⚠️ Skipping - no test user created")
            return True
            
        # Use form data for ad creation
        form_data = {
            "title": "Test Ad - Looking for Connection",
            "description": "This is a test ad for the Limpopo classifieds platform",
            "category": "Men Seeking Women",
            "location": "Polokwane", 
            "user_id": self.test_user_id,
            "age": "28",
            "phone": "+27123456789"
        }
        
        success, response = self.run_test(
            "Create Ad",
            "POST",
            "api/ads",
            200,
            data=form_data,
            is_form_data=True
        )
        if success and 'ad_id' in response:
            self.test_ad_id = response['ad_id']
            print(f"   ✅ Ad created with ID: {self.test_ad_id}")
            return True
        return success

    def test_get_ads(self):
        """Test getting ads list"""
        success, response = self.run_test(
            "Get Ads List",
            "GET",
            "api/ads",
            200
        )
        if success and 'ads' in response:
            print(f"   ✅ Found {len(response['ads'])} ads")
            return True
        return success

    def test_get_ads_with_filters(self):
        """Test getting ads with filters"""
        success, response = self.run_test(
            "Get Ads with Category Filter",
            "GET",
            "api/ads?category=Men Seeking Women&location=Polokwane",
            200
        )
        return success

    def test_get_single_ad(self):
        """Test getting a single ad"""
        if not self.test_ad_id:
            print("   ⚠️ Skipping - no test ad created")
            return True
            
        success, response = self.run_test(
            "Get Single Ad",
            "GET",
            f"api/ads/{self.test_ad_id}",
            200
        )
        if success and response.get('id') == self.test_ad_id:
            print(f"   ✅ Retrieved ad with correct ID")
            return True
        return success

    def test_nonexistent_ad(self):
        """Test getting non-existent ad"""
        fake_id = str(uuid.uuid4())
        success, response = self.run_test(
            "Get Non-existent Ad (should fail)",
            "GET",
            f"api/ads/{fake_id}",
            404  # Should fail with 404
        )
        return success

def main():
    print("🚀 Starting Limpopo Classifieds API Tests")
    print("=" * 50)
    
    tester = LimpopoClassifiedsAPITester()
    
    # Run all tests
    tests = [
        tester.test_health_check,
        tester.test_get_categories,
        tester.test_get_locations,
        tester.test_user_registration,
        tester.test_duplicate_registration,
        tester.test_user_login,
        tester.test_invalid_login,
        tester.test_create_ad,
        tester.test_get_ads,
        tester.test_get_ads_with_filters,
        tester.test_get_single_ad,
        tester.test_nonexistent_ad
    ]
    
    for test in tests:
        try:
            test()
        except Exception as e:
            print(f"❌ Test {test.__name__} failed with exception: {str(e)}")
    
    # Print final results
    print("\n" + "=" * 50)
    print(f"📊 FINAL RESULTS:")
    print(f"   Tests Run: {tester.tests_run}")
    print(f"   Tests Passed: {tester.tests_passed}")
    print(f"   Tests Failed: {tester.tests_run - tester.tests_passed}")
    print(f"   Success Rate: {(tester.tests_passed/tester.tests_run)*100:.1f}%")
    
    if tester.tests_passed == tester.tests_run:
        print("🎉 All tests passed!")
        return 0
    else:
        print("⚠️ Some tests failed - check backend implementation")
        return 1

if __name__ == "__main__":
    sys.exit(main())