import requests
from bs4 import BeautifulSoup
from dbwriter import DBWriter
import os

import sys

class Scraper:
    def return_1st_level_identifiers():
        # Define the URL of the website you want to scrape
        base_url = "https://accent.gmu.edu/browse_language.php/"
        # Send a GET request to the website
        response = requests.get(base_url)

        # Check if the request was successful
        if response.status_code == 200:
            # Parse the HTML content using BeautifulSoup
            output = []
            soup = BeautifulSoup(response.content, "html.parser")

            # Find all the links on the webpage
            ul = soup.find("ul", class_="languagelist")
            links = ul.find_all("a")

            # Iterate over each link
            for link in links:
                text = link.text
                output.append(text)
            return output
        else:
            print("Failed to retrieve the webpage")

    def scrape(self,db, start='aceh'):
        # Define the URL of the website you want to scrape
        base_url = "https://accent.gmu.edu/browse_language.php/"
        mp3url = "https://accent.gmu.edu"
        # Send a GET request to the website
        response = requests.get(base_url)

        # Check if the request was successful
        if response.status_code == 200:
            # Parse the HTML content using BeautifulSoup
            soup = BeautifulSoup(response.content, "html.parser")

            # Find all the links on the webpage
            ul = soup.find("ul", class_="languagelist")
            links = ul.find_all("a")
            #remove links until the start is found
            while links[0].text != start:
                links.pop(0)

            # Iterate over each link
            for link in links:
                
                href = link.get("href")
                url = base_url + href

                # Send a GET request to the linked site
                linked_response = requests.get(url)
                #skip if href="browse_language.php?function=find&language=hawai'i creole english" or href="browse_language.php?function=find&language=hawai'ian pidgin"
                if href == "browse_language.php?function=find&language=hawai'i creole english" or href == "browse_language.php?function=find&language=hawai'ian pidgin" or href == "browse_language.php?function=find&language=sa'a":
                    continue
                # Check if the request was successful
                if linked_response.status_code == 200:
                    # Parse the HTML content of the linked site
                    linked_soup = BeautifulSoup(linked_response.content, "html.parser")
                    content = linked_soup.find("div", class_="content")
                    links = content.find_all("a")
                    for link in links:
                        identifier = link.text[:-1]
                        href = link.get("href")
                        url = base_url + href
                        
                        linked_response = requests.get(url)
                        if linked_response.status_code == 200:
                            linked_soup = BeautifulSoup(linked_response.content, "html.parser")
                            audio = linked_soup.find("audio")
                            if audio:
                                audio_url = audio.source.get("src")
                                url = mp3url + audio_url
                                response = requests.get(url)
                                if response.status_code == 200:
                                    # Save the audio file
                                    # Create a subfolder named "mp3s" in the current directory
                                    # check the database to see if the identifier is already there
                                    unique = db.unique_identifier(identifier)
                                    while unique ==False:
                                        identifier = identifier + "_1"
                                        unique = db.unique_identifier(identifier)

                                    subfolder = "mp3s"
                                    filename = identifier+".mp3"

                                    # Specify the path to save the mp3 file
                                    save_path = os.path.join(subfolder, filename)
                                    
                                    # check if the file already exists and skip just the download if it does
                                    if not os.path.exists(save_path): 
                                        self.download_mp3(url, save_path)
                                else:
                                    print("Failed to download the audio file")
                                    raise Exception("Code execution stopped with an error message")
                                content = linked_soup.find("ul", class_="bio")
                                birth_place = content.find("em", text="birth place:").next_sibling.strip()
                                native_language = content.find("em", text="native language:").find_next("a").text
                                
                                other_languages = content.find("em", text="other language(s): ").next_sibling.strip()
                                age, sex = content.find("em", text="age, sex:").next_sibling.strip().split(", ")
                                age_of_english_onset = content.find("em", text="age of english onset:").next_sibling.strip()
                                english_learning_method = content.find("em", text="english learning method:").next_sibling.strip()
                                english_residence = content.find("em", text="english residence:").next_sibling.strip()
                                length_of_english_residence = content.find("em", text="length of english residence:").next_sibling.strip()

                                db.add_entry(identifier, birth_place, native_language, other_languages, age, sex, age_of_english_onset, english_learning_method, english_residence, length_of_english_residence, filename)
                                print(identifier)
                            else:
                                print("No audio element found")
                            
                        else:
                            print(f"Failed to retrieve the linked site: {href}")

                    # TODO: Add your logic for processing the linked site here

                else:
                    print(f"Failed to retrieve the linked site: {href}")

        else:
            print("Failed to retrieve the webpage")
        db.create_database("speakers.csv")
        print("Scraping completed")
        

    def download_mp3( url, file_path):
        response = requests.get(url)
        if response.status_code == 200:
            with open(file_path, "wb") as file:
                file.write(response.content)
            print("MP3 file downloaded successfully")
        else:
            print("Failed to download the MP3 file")

if __name__ == "__main__":
    


    args = sys.argv[1:]
    if len(args) > 0:
        # Process command line arguments here
        # Example: url = args[0]
        #          file_path = args[1]
        #          download_mp3(url, file_path)
        scraper=Scraper()
        db = DBWriter()
        db.read_from_csv("speakers.csv")
        print("Hello from the scraper!")
        
        try:
            scraper.scrape(db, args[0])
        except Exception as e:
            print(f"An exception occurred: {str(e)}")
            db.create_database("speakers.csv")
         
    else:
        db = DBWriter()
        scraper=Scraper()
        print("Hello from the scraper!")
        try:
            scraper.scrape(db)
        except Exception as e:
            print(f"An exception occurred: {str(e)}")
            db.create_database("speakers.csv")
    

