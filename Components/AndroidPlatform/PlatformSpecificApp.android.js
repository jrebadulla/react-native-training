import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
} from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { db, collection, getDocs } from "./firebase";
import Icon from "react-native-vector-icons/MaterialIcons";
import { debounce } from "lodash";
import { Animated } from "react-native";

export default function PlatformSpecificApp() {
  const [books, setBooks] = useState(() => []);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredBooks, setFilteredBooks] = useState(() => []);
  const [loading, setLoading] = useState(false);
  const spinValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (loading) {
      Animated.loop(
        Animated.timing(spinValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        })
      ).start();
    } else {
      spinValue.stopAnimation();
    }
  }, [loading]);

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  const loopAnimation = useRef(null);
  useEffect(() => {
    if (loading) {
      loopAnimation.current = Animated.loop(
        Animated.timing(spinValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        })
      );
      loopAnimation.current.start();
    } else {
      loopAnimation.current?.stop();
    }
  }, [loading]);

  useEffect(() => {
    let isMounted = true;
    const fetchBooks = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "books"));
        if (!isMounted) return;
        const booksList = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setBooks(booksList);
        setFilteredBooks(booksList);
      } catch (error) {
        console.error("Error fetching books:", error);
      }
    };
    fetchBooks();
    return () => {
      isMounted = false;
    };
  }, []);

  const debouncedSearch = useCallback(
    debounce((query) => {
      setLoading(true);
      const lowerCaseQuery = query.toLowerCase().trim();
      setFilteredBooks(
        books.filter((book) =>
          book.title?.toLowerCase().includes(lowerCaseQuery)
        )
      );
      setLoading(false);
    }, 200),
    [books]
  );

  const handleSearchChange = (text) => {
    setSearchQuery(text);
    debouncedSearch(text);
  };

  const handleClearSearch = () => {
    setSearchQuery("");
    setFilteredBooks(books);
  };

  const groupedBooks = useMemo(() => {
    return books.reduce((groups, book) => {
      const shelf = book.shelfLocation || "Unknown";
      if (!groups[shelf]) {
        groups[shelf] = [];
      }
      groups[shelf].push(book);
      return groups;
    }, {});
  }, [books]);

  return (
    <View style={styles.appContainer}>
      <View style={styles.inputContainer}>
        <TextInput
          style={[styles.textInput, styles.textInputWithIcon]}
          placeholder="Search for a book here..."
          value={searchQuery}
          onChangeText={handleSearchChange}
        />
        {loading ? (
          <Animated.View
            style={[styles.loadingIcon, { transform: [{ rotate: spin }] }]}
          >
            <Icon
              name="autorenew"
              size={24}
              color="#6D2323"
              style={styles.searchIcon}
            />
          </Animated.View>
        ) : searchQuery ? (
          <TouchableOpacity
            onPress={handleClearSearch}
            style={styles.clearButton}
          >
            <Icon name="clear" size={24} color="#6D2323" />
          </TouchableOpacity>
        ) : (
          <Icon
            name="search"
            size={24}
            color="#6D2323"
            style={styles.searchIcon}
          />
        )}
      </View>

      <Text style={styles.searchTitle}>Books:</Text>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {searchQuery ? (
          filteredBooks.length === 0 ? (
            <Text style={styles.noResults}>No Books found.</Text>
          ) : (
            Object.entries(
              filteredBooks.reduce((groups, book) => {
                const shelf = book.shelfLocation || "Unknown";
                if (!groups[shelf]) {
                  groups[shelf] = [];
                }
                groups[shelf].push(book);
                return groups;
              }, {})
            ).map(([shelfLocation, booksOnShelf]) => (
              <View key={shelfLocation} style={styles.shelfContainer}>
                <Text style={styles.shelfTitle}>Shelf {shelfLocation}</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.shelfRow}
                >
                  {booksOnShelf.map((book) => (
                    <TouchableOpacity key={book.id} style={styles.bookCard}>
                      <View style={styles.bookCover}>
                        <Text style={styles.bookTitle}>
                          {book.title || "Untitled"}
                        </Text>
                        <Text style={styles.bookAuthor}>
                          {book.author
                            ? `by ${book.author.trim()}`
                            : "Unknown Author"}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            ))
          )
        ) : (
          Object.keys(groupedBooks).map((shelfLocation) => (
            <View key={shelfLocation} style={styles.shelfContainer}>
              <Text style={styles.shelfTitle}>SHELF LOCATION NUMBER {shelfLocation}</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.shelfRow}
              >
                {groupedBooks[shelfLocation].map((book) => (
                  <TouchableOpacity key={book.id} style={styles.bookCard}>
                    <View style={styles.bookCover}>
                      <Text style={styles.bookTitle}>
                        {book.title || "Untitled"}
                      </Text>
                      <Text style={styles.bookAuthor}>
                        {book.author
                          ? `by ${book.author.trim()}`
                          : "Unknown Author"}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  appContainer: {
    flex: 1,
    backgroundColor: "#6D2323",
    padding: 10,
  },
  inputContainer: {
    marginBottom: 20,
    marginTop: 50,
    alignItems: "center",
  },
  textInput: {
    width: "100%",
    padding: 12,
    borderRadius: 8,
    backgroundColor: "#fff",
    borderColor: "#ddd",
    borderWidth: 1,
    fontSize: 16,
  },
  searchTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#FEF9E1",
    marginBottom: 10,
  },
  shelfContainer: {
    marginBottom: 30,
    padding: 10,
    backgroundColor: "#FEF9E1",
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 4,
  },
  shelfTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#444",
    marginBottom: 10,
    textAlign: "center",
  },
  scrollContainer: {
    paddingBottom: 20,
  },
  shelfRow: {
    flexDirection: "row",
    marginBottom: 15,
  },
  bookCard: {
    backgroundColor: "#FEF9E1",
    padding: 20,
    marginVertical: 10,
    marginRight: 15,
    borderRadius: 15,
    shadowColor: "rgba(0, 0, 0, 0.2)",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 6,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  bookCover: {
    width: 100,
    height: 150,
    borderRadius: 5,
    marginBottom: 10,
    justifyContent: "center",
    alignItems: "center",
    padding: 10,
  },
  bookTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#6D2323",
    textAlign: "center",
    marginBottom: 5,
  },
  bookAuthor: {
    fontSize: 12,
    fontWeight: "300",
    color: "#34495e",
    textAlign: "center",
  },
  clearButton: {
    position: "absolute",
    right: 10,
    top: 5,
    padding: 5,
  },
  noResults: {
    fontSize: 16,
    color: "#FEF9E1",
    textAlign: "center",
    marginTop: 20,
  },
  searchIcon: {
    position: "absolute",
    left: 10,
    top: 14,
    transform: [{ rotate: "360deg" }],
  },

  textInputWithIcon: {
    paddingLeft: 40,
  },
  loadingIcon: {
    position: "absolute",
    right: 10,
    top: 14,
  },
});
