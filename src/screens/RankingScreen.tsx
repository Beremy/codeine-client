import React, { useEffect, useState } from "react";
import { View, Text, FlatList, TouchableOpacity, ScrollView } from "react-native";
import { useTailwind } from "tailwind-rn";
import { getUsersOrderedByPoints } from 'services/api/user';
import { User } from "models/User";

const RankingScreen = ({ }) => {
    const tw = useTailwind();
    const [users, setUsers] = useState<User[]>([]);
    const [page, setPage] = useState(1);
    const limit = 20;
    const [hasMoreUsers, setHasMoreUsers] = useState(true);

    useEffect(() => {
        fetchUsers();
    }, [page]);

    const fetchUsers = async () => {
        getUsersOrderedByPoints(page)
            .then((result: any) => {
                setUsers(result.data);

                if (result.data.length < limit) {
                    setHasMoreUsers(false);
                } else {
                    setHasMoreUsers(true);
                }
            });
    };

    const renderItem = ({ item, index }: { item: User, index: number }) => (
        <View
            key={item.id}
            style={[
                tw('p-2 flex-row items-center justify-between'),
                index % 2 === 0 ? tw('bg-blue-100') : tw('bg-white'),
            ]}
        >
            <Text>
                {item.ranking}. {item.username}
            </Text>
            <Text>{item.points} points</Text>
        </View>
    );

    return (
        <ScrollView style={tw('flex-1 p-4')}>
            <View style={tw("mx-auto min-w-[540px]")}>
                <Text style={tw('text-xl mb-4')}>Classements</Text>
                <FlatList
                    data={users}
                    renderItem={renderItem}
                    keyExtractor={item => item.id.toString()}
                />
                {page > 1 && (
                    <TouchableOpacity onPress={() => setPage(page - 1)}>
                        <Text style={tw('text-blue-500 mt-2')}>Page précédente</Text>
                    </TouchableOpacity>
                )}
                {hasMoreUsers && (
                    <TouchableOpacity onPress={() => setPage(page + 1)}>
                        <Text style={tw('text-blue-500 mt-2')}>Page suivante</Text>
                    </TouchableOpacity>
                )}
            </View>
        </ScrollView>
    );

};

export default RankingScreen;
