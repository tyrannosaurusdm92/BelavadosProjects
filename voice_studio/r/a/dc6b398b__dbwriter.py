import pandas as pd
import os

class DBWriter:
    def __init__(self):
        self.data = {
            'identifier': [], 
            'birth_place': [],
            'native_language': [],
            'other_languages': [],
            'age': [],
            'sex': [],
            'age_of_english_onset': [],
            'english_learning_method': [],
            'english_residence': [],
            'length_of_english_residence': [],
            'mp3_name': []
        }
    
    def add_entry(self,identifier, birth_place, native_language, other_languages, age, sex, age_of_english_onset, english_learning_method, english_residence, length_of_english_residence, mp3_name):
        self.data['identifier'].append(identifier)
        self.data['birth_place'].append(birth_place)
        self.data['native_language'].append(native_language)
        self.data['other_languages'].append(other_languages)
        self.data['age'].append(age)
        self.data['sex'].append(sex)
        self.data['age_of_english_onset'].append(age_of_english_onset)
        self.data['english_learning_method'].append(english_learning_method)
        self.data['english_residence'].append(english_residence)
        self.data['length_of_english_residence'].append(length_of_english_residence)
        self.data['mp3_name'].append(mp3_name)
    
    def create_database(self, filename):
        df = pd.DataFrame(self.data)
        # sort by identifier
        #add temporary columns called identifier root and number
        df['identifier_root'] = df['identifier'].str.extract(r'(\D+)')
        df['number'] = df['identifier'].str.extract(r'(\d+)')
        df['number'] = df['number'].astype(int)
        #print the first line of the data
        #sort by identifier root and number
        df = df.sort_values(by=['identifier_root', 'number'], ascending=[True, True])
        #remove temporary columns
        df.drop(columns=['identifier_root', 'number'], inplace=True)
        df.to_csv(filename, index=False)

    def read_from_csv(self, filename):
        df = pd.read_csv(filename)
        self.data = df.to_dict(orient='list')
    def remove_non_existing(self):
        # checks the mp3 directory, and if the file does not exist, removes the entry from the database
        df = pd.DataFrame(self.data)
        removed = 0
        #get list of files in the mp3 directory
        mp3_directory = "mp3s"
        mp3_files = os.listdir(mp3_directory)
        for index, row in df.iterrows():
            if row['mp3_name'] not in mp3_files:
                df.drop(index, inplace=True)
                removed += 1
        self.data = df.to_dict(orient='list')
        return removed
    

    def unique_identifier(self, identifier):
        if identifier in self.data['identifier']:
            return False
        else:
            return True
        
if __name__ == "__main__":
    db = DBWriter()
    db.read_from_csv("speakers.csv")
    print(db.remove_non_existing())
    db.create_database("speakers1.csv")
